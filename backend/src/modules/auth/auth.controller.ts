import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { RefreshTokenGuard } from '@/common/guards/refresh-token.guard';
import { extractBearerToken } from '@/common/utils/token.util';
import { AuthService, type AuthPerfSummary } from './auth.service';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { AuthenticatedUserResponseDto } from './dto/authenticated-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { LogoutDto } from './dto/logout.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Registers a new FibroSync patient account.' })
  @ApiCreatedResponse({ type: AuthSessionResponseDto })
  @ApiConflictResponse({
    description: 'A user with this email already exists.',
  })
  signup(@Body() dto: SignupDto, @Req() request: Request): Promise<unknown> {
    return this.authService.signup(
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
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Authenticates a user and returns access and refresh tokens.',
  })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    let perfSummary: AuthPerfSummary | undefined;
    const session = await this.authService.login(
      dto.email,
      dto.password,
      this.buildSessionMetadata(request),
      this.isAuthPerfEnabled(request)
        ? (summary) => {
            perfSummary = summary;
          }
        : undefined,
    );

    this.attachAuthPerfHeader(response, perfSummary);
    return session;
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Rotates the current refresh token and returns a new session.',
  })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid or expired.',
  })
  async refreshToken(
    @Headers('authorization') authorization?: string,
    @Req() request?: Request,
    @Res({ passthrough: true }) response?: Response,
  ): Promise<unknown> {
    const refreshToken = extractBearerToken(authorization);

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token.');
    }

    let perfSummary: AuthPerfSummary | undefined;
    const session = await this.authService.refreshToken(
      refreshToken,
      this.buildSessionMetadata(request),
      this.isAuthPerfEnabled(request)
        ? (summary) => {
            perfSummary = summary;
          }
        : undefined,
    );

    this.attachAuthPerfHeader(response, perfSummary);
    return session;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Revokes the current refresh token or all active sessions.',
  })
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(
    @CurrentUser('sub') userId: string,
    @Body() dto: LogoutDto,
  ): Promise<unknown> {
    return this.authService.logout(
      userId,
      dto.refreshToken,
      dto.logoutFromAllDevices,
    );
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Returns the authenticated user profile.' })
  @ApiOkResponse({ type: AuthenticatedUserResponseDto })
  me(@CurrentUser('sub') userId: string): Promise<unknown> {
    return this.authService.getAuthenticatedUser(userId);
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

  private isAuthPerfEnabled(request?: Request): boolean {
    return request?.get('x-auth-perf') === '1';
  }

  private attachAuthPerfHeader(
    response: Response | undefined,
    perfSummary?: AuthPerfSummary,
  ): void {
    if (!response || !perfSummary) {
      return;
    }

    response.setHeader('x-auth-perf', JSON.stringify(perfSummary));
  }
}
