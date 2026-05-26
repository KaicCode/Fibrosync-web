import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createServer } from 'node:net';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

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

  app.enableCors({
    origin: frontendUrl ?? 'http://localhost:5173',
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
  logger.log(`FibroSync API listening on http://localhost:${port}/${apiPrefix}`);
}

void bootstrap();
