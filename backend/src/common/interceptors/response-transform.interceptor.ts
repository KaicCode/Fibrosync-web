import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          typeof data === 'object' &&
          data !== null &&
          'success' in data &&
          'timestamp' in data
        ) {
          return data;
        }

        return {
          success: true,
          timestamp: new Date().toISOString(),
          path: request.originalUrl,
          data,
        };
      }),
    );
  }
}
