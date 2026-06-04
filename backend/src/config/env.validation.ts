import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3100),
  API_PREFIX: Joi.string().default('api/v1'),
  APP_NAME: Joi.string().default('FibroSync API'),
  APP_VERSION: Joi.string().default('1.0.0'),
  FRONTEND_URL: Joi.string().uri().optional(),
  SWAGGER_PATH: Joi.string().default('docs'),
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_TTL: Joi.string().default('7d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(8).max(15).default(12),
  GEMINI_API_KEY: Joi.string().optional(),
  GEMINI_MODEL: Joi.string().default('gemini-2.5-flash'),
  AI_PREDICTION_LOOKBACK_DAYS: Joi.number()
    .integer()
    .min(7)
    .max(90)
    .default(21),
  AI_PATTERN_ANALYSIS_LOOKBACK_DAYS: Joi.number()
    .integer()
    .min(14)
    .max(90)
    .default(30),
  AI_PREDICTION_PROMPT_VERSION: Joi.string().default('v1'),
  OPENAI_API_KEY: Joi.string().allow('').optional(),
});
