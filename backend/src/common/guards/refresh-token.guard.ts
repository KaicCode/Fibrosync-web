import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../types/jwt-payload.type';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser extends AuthenticatedUser>(
    err: unknown,
    user: TUser | undefined,
  ): TUser {
    if (err || !user) {
      throw err instanceof Error ? err : new UnauthorizedException();
    }

    return user;
  }
}
