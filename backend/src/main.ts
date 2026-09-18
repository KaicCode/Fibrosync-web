import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createServer } from 'node:net';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeOriginPattern(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

// F-15: production must never trust a wildcard *.vercel.app subdomain —
// anyone can deploy a Vercel app under that suffix, so combined with
// `credentials: true` it would let an attacker-controlled origin read
// authenticated responses. Wildcards and localhost are development-only
// conveniences now; production relies solely on FRONTEND_URL plus the
// fixed production domains below.
const PRODUCTION_DEFAULT_ALLOWED_ORIGINS = [
  'https://fibrosync.com',
  'https://www.fibrosync.com',
];

const DEVELOPMENT_DEFAULT_ALLOWED_ORIGINS = [
  ...PRODUCTION_DEFAULT_ALLOWED_ORIGINS,
  'http://localhost:*',
  'http://127.0.0.1:*',
  'http://0.0.0.0:*',
  'https://*.vercel.app',
];

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

function resolveAllowedOrigins(
  frontendUrl: string | undefined,
  isProduction: boolean,
): string[] {
  const configured = frontendUrl
    ?.split(',')
    .map((value) => normalizeOriginPattern(value))
    .filter(Boolean);

  const defaults = isProduction
    ? PRODUCTION_DEFAULT_ALLOWED_ORIGINS
    : DEVELOPMENT_DEFAULT_ALLOWED_ORIGINS;

  return Array.from(new Set([...(configured ?? []), ...defaults]));
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
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const port = configService.get<number>('app.port', 3100);
  const frontendUrl = configService.get<string | undefined>('app.frontendUrl');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const allowedOrigins = resolveAllowedOrigins(frontendUrl, isProduction);

  if (!frontendUrl?.trim()) {
    logger.warn(
      `FRONTEND_URL is not set. Falling back to default origins: ${allowedOrigins.join(', ')}`,
    );
  }

  logger.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);

  // F-10 / F-15: this app runs behind a single reverse proxy in production
  // (Render or equivalent PaaS). Trusting exactly one hop lets Express
  // resolve `req.ip` from X-Forwarded-For correctly for rate limiting and
  // refresh-token session metadata, without blindly trusting an arbitrary
  // client-supplied forwarding chain.
  app.set('trust proxy', 1);

  app.use(cookieParser());

  // F-16: security headers. This backend only ever serves JSON plus the
  // Swagger UI HTML page at /docs — script-src/style-src 'unsafe-inline' is
  // scoped narrowly and is required because swagger-ui-express renders via
  // bundled inline scripts/styles; every other response is JSON and is
  // unaffected by CSP. Nothing here should ever be framed.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: isProduction
        ? { maxAge: 15552000, includeSubDomains: true }
        : false,
      referrerPolicy: { policy: 'no-referrer' },
      frameguard: { action: 'deny' },
    }),
  );

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
