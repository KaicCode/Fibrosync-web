import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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

@Injectable()
export class AuthService {
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
  ): Promise<SessionResponse> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.usersService.markLastLogin(user.id);
    const publicUser = await this.usersService.findPublicById(user.id);
    const session = await this.createSession(publicUser, metadata);

    return {
      user: publicUser,
      ...session,
    };
  }

  async refreshToken(
    rawRefreshToken: string,
    metadata: SessionMetadata,
  ): Promise<SessionResponse> {
    const payload = await this.verifyRefreshToken(rawRefreshToken);

    if (!payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        id: payload.tokenId,
        userId: payload.sub,
      },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Refresh token is no longer valid.');
    }

    const tokenMatches = await bcrypt.compare(
      rawRefreshToken,
      storedToken.tokenHash,
    );

    if (!tokenMatches) {
      await this.revokeAllTokens(payload.sub);
      throw new UnauthorizedException('Refresh token is no longer valid.');
    }

    const publicUser = await this.usersService.findPublicById(payload.sub);
    const tokenPair = await this.generateTokenPair(publicUser);

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
          replacedByTokenId: tokenPair.refreshTokenId,
        },
      });

      await this.persistRefreshToken(tx, publicUser.id, tokenPair, metadata);
    });

    return {
      user: publicUser,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenType: 'Bearer',
      accessTokenTtl: this.accessTokenTtl,
      refreshTokenTtl: this.refreshTokenTtl,
    };
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
  ): Promise<Omit<SessionResponse, 'user'>> {
    const tokenPair = await this.generateTokenPair(user);
    await this.persistRefreshToken(this.prisma, user.id, tokenPair, metadata);

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
  ): Promise<void> {
    const tokenHash = await bcrypt.hash(
      tokenPair.refreshToken,
      this.bcryptSaltRounds,
    );

    await prismaClient.refreshToken.create({
      data: {
        id: tokenPair.refreshTokenId,
        userId,
        tokenHash,
        expiresAt: tokenPair.refreshTokenExpiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
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
}
