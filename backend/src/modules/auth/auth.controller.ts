import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { RefreshTokenGuard } from '@/common/guards/refresh-token.guard';
import { TrustedClientGuard } from '@/common/guards/trusted-client.guard';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  TRUSTED_CLIENT_HEADER_NAME,
  TRUSTED_CLIENT_HEADER_VALUE,
  buildClearRefreshTokenCookieOptions,
  buildRefreshTokenCookieOptions,
  extractRefreshTokenFromRequest,
} from '@/common/utils/cookie.util';
import { parseDurationToMilliseconds } from '@/common/utils/duration.util';
import { AuthService, type SessionResponse } from './auth.service';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { AuthenticatedUserResponseDto } from './dto/authenticated-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { LogoutDto } from './dto/logout.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;
  private readonly refreshCookiePath: string;

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
    // F-14: restrict the refresh cookie to only the routes that need it,
    // instead of sending it on every request to the API.
    this.refreshCookiePath = `/${apiPrefix}/auth`;
  }

  @Public()
  // F-10: signup is rarely legitimate more than a handful of times per IP
  // in a short window (e.g. a shared household/office network); 10 per 15
  // minutes stops scripted account-farming without blocking real users.
  @Throttle({ default: { limit: 10, ttl: seconds(15 * 60) } })
  @Post('signup')
  @ApiOperation({ summary: 'Registers a new FibroSync patient account.' })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  @ApiConflictResponse({
    description: 'A user with this email already exists.',
  })
  async signup(
    @Body() dto: SignupDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const session = await this.authService.signup(
      dto.email,
      dto.password,
      {
        fullName: dto.fullName,
        birthDate: dto.birthDate,
        gender: dto.gender,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        countryCode: dto.countryCode,
        timezone: dto.timezone,
      },
      this.buildSessionMetadata(request),
    );

    return this.finalizeSession(response, session);
  }

  @Public()
  // F-10: brute-force / credential-stuffing mitigation. Kept IP-scoped
  // (not per-account) deliberately — a per-account limit would let an
  // attacker lock a legitimate user out of their own account just by
  // knowing their email and hammering /auth/login from many IPs.
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary:
      'Authenticates a user and returns an access token; the refresh token is set as an httpOnly cookie.',
  })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const session = await this.authService.login(
      dto.email,
      dto.password,
      this.buildSessionMetadata(request),
    );

    return this.finalizeSession(response, session);
  }

  @Public()
  // F-10: generous enough to not break legitimate multi-tab usage or the
  // silent refresh performed on app boot, while still bounding abuse.
  @Throttle({ default: { limit: 30, ttl: seconds(60) } })
  @UseGuards(RefreshTokenGuard, TrustedClientGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiHeader({
    name: TRUSTED_CLIENT_HEADER_NAME,
    description: `Must be "${TRUSTED_CLIENT_HEADER_VALUE}". CSRF safeguard for this cookie-authenticated endpoint.`,
    required: true,
  })
  @ApiOperation({
    summary:
      'Rotates the refresh token (read from the httpOnly cookie) and returns a new access token.',
  })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid, missing or expired.',
  })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const refreshToken = extractRefreshTokenFromRequest(request);

    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Missing refresh token.',
      });
    }

    const session = await this.authService.refreshToken(
      refreshToken,
      this.buildSessionMetadata(request),
    );

    return this.finalizeSession(response, session);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Revokes the current refresh token or all active sessions.',
  })
  @ApiOkResponse({ type: LogoutResponseDto })
  async logout(
    @CurrentUser('sub') userId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: LogoutDto,
  ): Promise<unknown> {
    const refreshToken = extractRefreshTokenFromRequest(request);

    const result = await this.authService.logout(
      userId,
      refreshToken ?? undefined,
      dto.logoutFromAllDevices,
    );

    response.clearCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      buildClearRefreshTokenCookieOptions({
        isProduction: this.isProduction,
        path: this.refreshCookiePath,
      }),
    );

    return result;
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Returns the authenticated user profile.' })
  @ApiOkResponse({ type: AuthenticatedUserResponseDto })
  me(@CurrentUser('sub') userId: string): Promise<unknown> {
    return this.authService.getAuthenticatedUser(userId);
  }

  /**
   * F-14: sets the refresh token as an httpOnly cookie and returns
   * everything else to the client. The refresh token itself never appears
   * in the JSON response body from this point on.
   */
  private finalizeSession(
    response: Response,
    session: SessionResponse,
  ): Omit<SessionResponse, 'refreshToken'> {
    const maxAgeMs = parseDurationToMilliseconds(session.refreshTokenTtl);

    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      session.refreshToken,
      buildRefreshTokenCookieOptions(
        { isProduction: this.isProduction, path: this.refreshCookiePath },
        maxAgeMs,
      ),
    );

    return {
      user: session.user,
      accessToken: session.accessToken,
      tokenType: session.tokenType,
      accessTokenTtl: session.accessTokenTtl,
      refreshTokenTtl: session.refreshTokenTtl,
    };
  }

  private buildSessionMetadata(request?: Request): {
    ipAddress?: string;
    userAgent?: string;
  } {
    return {
      ipAddress: request?.ip,
      userAgent: request?.get('user-agent'),
    };
  }
}
