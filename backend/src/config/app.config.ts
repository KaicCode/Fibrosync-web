import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'FibroSync API',
  version: process.env.APP_VERSION ?? '1.0.0',
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
  frontendUrl: process.env.FRONTEND_URL,
}));
