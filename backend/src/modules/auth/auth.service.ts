import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { performance } from 'node:perf_hooks';
import type { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { JwtPayload } from '@/common/types/jwt-payload.type';
import { addDuration } from '@/common/utils/duration.util';
import { PrismaService } from '@/database/prisma.service';
import type { PublicUser } from '@/modules/users/users.select';
import { UsersService } from '@/modules/users/users.service';

interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  refreshTokenExpiresAt: Date;
}

interface SessionResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessTokenTtl: string;
  refreshTokenTtl: string;
}

export interface AuthPerfSummary {
  flow: 'login' | 'refresh';
  bcryptRounds: number;
  totalLabel: 'login_total' | 'refresh_total';
  totalMs: number;
  steps: Array<{
    stage: string;
    durationMs: number;
  }>;
}

interface AuthPerfTracker {
  enabled: boolean;
  flow: AuthPerfSummary['flow'];
  totalLabel: AuthPerfSummary['totalLabel'];
  steps: AuthPerfSummary['steps'];
  finalize: (totalMs: number) => void;
}

type AuthPerfSink = ((summary: AuthPerfSummary) => void) | undefined;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenSecret: string;
  private readonly accessTokenTtl: string;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenTtl: string;
  private readonly bcryptSaltRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessTokenSecret = configService.getOrThrow<string>(
      'auth.accessTokenSecret',
    );
    this.accessTokenTtl = configService.get<string>(
      'auth.accessTokenTtl',
      '15m',
    );
    this.refreshTokenSecret = configService.getOrThrow<string>(
      'auth.refreshTokenSecret',
    );
    this.refreshTokenTtl = configService.get<string>(
      'auth.refreshTokenTtl',
      '7d',
    );
    this.bcryptSaltRounds = configService.get<number>(
      'auth.bcryptSaltRounds',
      12,
    );
  }

  async signup(
    email: string,
    password: string,
    profile: {
      fullName: string;
      birthDate?: string;
      gender?: string;
      heightCm?: number;
      weightKg?: number;
      countryCode?: string;
      timezone?: string;
    },
    metadata: SessionMetadata,
  ): Promise<SessionResponse> {
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, this.bcryptSaltRounds);
    const user = await this.usersService.createPatient({
      email,
      passwordHash,
      ...profile,
    });

    const session = await this.createSession(user, metadata);

    return {
      user,
      ...session,
    };
  }

  async login(
    email: string,
    password: string,
    metadata: SessionMetadata,
    perfSink?: AuthPerfSink,
  ): Promise<SessionResponse> {
    const startedAt = performance.now();
    const perf = this.createPerfTracker('login', perfSink);

    try {
      const user = await this.measurePerfStep(perf, 'findByEmail', () =>
        this.usersService.findByEmail(email),
      );

      if (!user) {
        throw new UnauthorizedException('Invalid email or password.');
      }

      const isPasswordValid = await this.measurePerfStep(
        perf,
        'bcrypt.compare_password',
        () => bcrypt.compare(password, user.passwordHash),
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password.');
      }

      await this.measurePerfStep(perf, 'markLastLogin', () =>
        this.usersService.markLastLogin(user.id),
      );
      const publicUser = await this.measurePerfStep(perf, 'findPublicById', () =>
        this.usersService.findPublicById(user.id),
      );
      const session = await this.createSession(publicUser, metadata, perf);

      return {
        user: publicUser,
        ...session,
      };
    } finally {
      perf.finalize(performance.now() - startedAt);
    }
  }

  async refreshToken(
    rawRefreshToken: string,
    metadata: SessionMetadata,
    perfSink?: AuthPerfSink,
  ): Promise<SessionResponse> {
    const startedAt = performance.now();
    const perf = this.createPerfTracker('refresh', perfSink);
    const payload = await this.verifyRefreshToken(rawRefreshToken);

    if (!payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    try {
      const storedToken = await this.measurePerfStep(
        perf,
        'findStoredRefreshToken',
        () =>
          this.prisma.refreshToken.findFirst({
            where: {
              id: payload.tokenId,
              userId: payload.sub,
            },
          }),
      );

      if (
        !storedToken ||
        storedToken.revokedAt ||
        storedToken.expiresAt <= new Date()
      ) {
        throw new UnauthorizedException('Refresh token is no longer valid.');
      }

      const tokenMatches = await this.measurePerfStep(
        perf,
        'bcrypt.compare_refresh_token',
        () => bcrypt.compare(rawRefreshToken, storedToken.tokenHash),
      );

      if (!tokenMatches) {
        await this.revokeAllTokens(payload.sub);
        throw new UnauthorizedException('Refresh token is no longer valid.');
      }

      const publicUser = await this.measurePerfStep(perf, 'findPublicById', () =>
        this.usersService.findPublicById(payload.sub),
      );
      const tokenPair = await this.measurePerfStep(perf, 'JWT/signAsync', () =>
        this.generateTokenPair(publicUser),
      );

      await this.prisma.$transaction(async (tx) => {
        await this.persistRefreshToken(
          tx,
          publicUser.id,
          tokenPair,
          metadata,
          perf,
        );

        await this.measurePerfStep(perf, 'revokePreviousRefreshToken', () =>
          tx.refreshToken.update({
            where: {
              id: storedToken.id,
            },
            data: {
              revokedAt: new Date(),
              lastUsedAt: new Date(),
              replacedByTokenId: tokenPair.refreshTokenId,
            },
          }),
        );
      });

      return {
        user: publicUser,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: 'Bearer',
        accessTokenTtl: this.accessTokenTtl,
        refreshTokenTtl: this.refreshTokenTtl,
      };
    } finally {
      perf.finalize(performance.now() - startedAt);
    }
  }

  async logout(
    userId: string,
    refreshToken?: string,
    logoutFromAllDevices?: boolean,
  ): Promise<{
    message: string;
  }> {
    if (logoutFromAllDevices || !refreshToken) {
      await this.revokeAllTokens(userId);

      return {
        message: 'All active sessions were revoked successfully.',
      };
    }

    const payload = await this.verifyRefreshToken(refreshToken);

    if (payload.sub !== userId || !payload.tokenId) {
      throw new UnauthorizedException(
        'Refresh token does not belong to the authenticated user.',
      );
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        id: payload.tokenId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Current session was revoked successfully.',
    };
  }

  async getAuthenticatedUser(userId: string): Promise<PublicUser> {
    return this.usersService.findPublicById(userId);
  }

  private async createSession(
    user: PublicUser,
    metadata: SessionMetadata,
    perf?: AuthPerfTracker,
  ): Promise<Omit<SessionResponse, 'user'>> {
    const tokenPair = await this.measurePerfStep(perf, 'JWT/signAsync', () =>
      this.generateTokenPair(user),
    );
    await this.persistRefreshToken(this.prisma, user.id, tokenPair, metadata, perf);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenType: 'Bearer',
      accessTokenTtl: this.accessTokenTtl,
      refreshTokenTtl: this.refreshTokenTtl,
    };
  }

  private async generateTokenPair(
    user: Pick<PublicUser, 'id' | 'email' | 'role'>,
  ): Promise<TokenPair> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const refreshTokenId = randomUUID();
    const refreshPayload: JwtPayload = {
      ...accessPayload,
      tokenId: refreshTokenId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessTokenSecret,
        expiresIn: this.accessTokenTtl,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenTtl,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshTokenId,
      refreshTokenExpiresAt: addDuration(new Date(), this.refreshTokenTtl),
    };
  }

  private async persistRefreshToken(
    prismaClient: Prisma.TransactionClient | PrismaService,
    userId: string,
    tokenPair: TokenPair,
    metadata: SessionMetadata,
    perf?: AuthPerfTracker,
  ): Promise<void> {
    const tokenHash = await this.measurePerfStep(
      perf,
      'bcrypt.hash_refresh_token',
      () => bcrypt.hash(tokenPair.refreshToken, this.bcryptSaltRounds),
    );

    await this.measurePerfStep(perf, 'persistRefreshToken', () =>
      prismaClient.refreshToken.create({
        data: {
          id: tokenPair.refreshTokenId,
          userId,
          tokenHash,
          expiresAt: tokenPair.refreshTokenExpiresAt,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      }),
    );
  }

  private async revokeAllTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  private createPerfTracker(
    flow: AuthPerfSummary['flow'],
    sink?: AuthPerfSink,
  ): AuthPerfTracker {
    const totalLabel = flow === 'login' ? 'login_total' : 'refresh_total';
    const steps: AuthPerfSummary['steps'] = [];
    const enabled = Boolean(sink);

    return {
      enabled,
      flow,
      totalLabel,
      steps,
      finalize: (totalMs: number) => {
        if (!enabled) {
          return;
        }

        const roundedTotalMs = this.roundDuration(totalMs);
        this.logger.log(
          `[AUTH PERF] flow=${flow} bcrypt_rounds=${this.bcryptSaltRounds}`,
        );
        this.logger.log(
          `[AUTH PERF] flow=${flow} ${totalLabel}=${roundedTotalMs}ms`,
        );

        sink?.({
          flow,
          bcryptRounds: this.bcryptSaltRounds,
          totalLabel,
          totalMs: roundedTotalMs,
          steps,
        });
      },
    };
  }

  private async measurePerfStep<T>(
    perf: AuthPerfTracker | undefined,
    stage: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    const startedAt = performance.now();

    try {
      return await callback();
    } finally {
      if (perf?.enabled) {
        const durationMs = this.roundDuration(performance.now() - startedAt);
        perf.steps.push({
          stage,
          durationMs,
        });
        this.logger.log(
          `[AUTH PERF] flow=${perf.flow} etapa=${stage} duration=${durationMs}ms`,
        );
      }
    }
  }

  private roundDuration(durationMs: number): number {
    return Number(durationMs.toFixed(1));
  }
}
