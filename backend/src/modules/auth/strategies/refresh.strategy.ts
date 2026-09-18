import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import type { JwtPayload } from '@/common/types/jwt-payload.type';
import { extractRefreshTokenFromRequest } from '@/common/utils/cookie.util';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      // F-14: the refresh token now travels as an httpOnly cookie by
      // default. The Authorization header extractor is kept only as a
      // fallback for manual/API testing (e.g. Swagger) — see
      // cookie.util.ts for why this does not weaken CSRF protection.
      jwtFromRequest: (request: Request) =>
        extractRefreshTokenFromRequest(request),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('auth.refreshTokenSecret'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
