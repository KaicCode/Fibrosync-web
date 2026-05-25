import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  const appName = configService.get<string>('app.name', 'FibroSync API');
  const appVersion = configService.get<string>('app.version', '1.0.0');
  const swaggerPath = configService.get<string>('app.swaggerPath', 'docs');

  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(
      'Enterprise-grade FibroSync API for fibromyalgia monitoring, crisis prediction and patient support.',
    )
    .setVersion(appVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token',
      },
      'access-token',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Refresh token',
      },
      'refresh-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
