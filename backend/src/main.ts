import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createServer } from 'node:net';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeOriginPattern(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function matchesOriginPattern(origin: string, pattern: string): boolean {
  const normalizedOrigin = normalizeOriginPattern(origin);
  const normalizedPattern = normalizeOriginPattern(pattern);

  if (!normalizedPattern.includes('*')) {
    return normalizedOrigin === normalizedPattern;
  }

  const regex = new RegExp(
    `^${escapeRegex(normalizedPattern).replace(/\\\*/g, '.*')}$`,
    'i',
  );

  return regex.test(normalizedOrigin);
}

function resolveAllowedOrigins(frontendUrl?: string): string[] {
  const configured = frontendUrl
    ?.split(',')
    .map((value) => normalizeOriginPattern(value))
    .filter(Boolean);

  if (configured && configured.length > 0) {
    return configured;
  }

  return ['http://localhost:5173'];
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const port = configService.get<number>('app.port', 3100);
  const frontendUrl = configService.get<string | undefined>('app.frontendUrl');
  const allowedOrigins = resolveAllowedOrigins(frontendUrl);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed = allowedOrigins.some((pattern) =>
        matchesOriginPattern(origin, pattern),
      );

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(
        new Error(`CORS blocked for origin ${origin}. Allowed: ${allowedOrigins.join(', ')}`),
        false,
      );
    },
    credentials: true,
  });
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  setupSwagger(app, configService);

  const portAvailable = await isPortAvailable(port);

  if (!portAvailable) {
    logger.warn(
      `Port ${port} is already in use. Another backend instance is probably running on http://localhost:${port}/${apiPrefix}.`,
    );
    await app.close();
    return;
  }

  await app.listen(port);
  logger.log(
    `FibroSync API listening on http://localhost:${port}/${apiPrefix}`,
  );
}

void bootstrap();
