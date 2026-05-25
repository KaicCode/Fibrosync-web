import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, error, details } = this.mapException(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      details,
    });
  }

  private mapException(exception: unknown): {
    status: number;
    error: string;
    details?: unknown;
  } {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const target = Array.isArray(exception.meta?.target)
          ? exception.meta.target.join(', ')
          : 'resource';

        return {
          status: HttpStatus.CONFLICT,
          error: `Duplicate value for ${target}.`,
          details: exception.meta,
        };
      }

      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          error: 'Resource not found.',
        };
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          status,
          error: response,
        };
      }

      if (typeof response === 'object' && response !== null) {
        const responseBody = response as Record<string, unknown>;
        const message = responseBody.message;

        return {
          status,
          error:
            typeof message === 'string'
              ? message
              : exception.message || 'Request failed.',
          details: Array.isArray(message) ? message : responseBody,
        };
      }

      return {
        status,
        error: exception.message,
      };
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: exception.message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal server error.',
    };
  }
}
