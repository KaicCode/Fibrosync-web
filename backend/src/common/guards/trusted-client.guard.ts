import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { hasTrustedClientHeader } from '../utils/cookie.util';

/**
 * F-14 CSRF mitigation for cookie-authenticated endpoints. See
 * cookie.util.ts for the full reasoning. Must be combined with the strict
 * CORS origin allow-list in main.ts to be effective.
 */
@Injectable()
export class TrustedClientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!hasTrustedClientHeader(request)) {
      throw new ForbiddenException({
        code: 'UNTRUSTED_CLIENT',
        message: 'This endpoint requires a trusted client header.',
      });
    }

    return true;
  }
}
