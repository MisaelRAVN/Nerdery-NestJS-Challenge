import Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().port().default(3000),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  ACCESS_TOKEN_SECRET: Joi.string().min(32).required(),
  ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('30s'),
  REFRESH_TOKEN_SECRET: Joi.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('3h'),
  PASSWORD_RESET_TOKEN_SECRET: Joi.string().min(32).required(),
  PASSWORD_RESET_TOKEN_EXPIRES_IN: Joi.string().default('10m'),

  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),

  STRIPE_API_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),

  CLOUDINARY_CLOUD_NAME: Joi.string().alphanum().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  MAIL_HOST: Joi.string().hostname().required(),
  MAIL_USER: Joi.string().email().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),
});
