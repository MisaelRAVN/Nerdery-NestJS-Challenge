import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaRequestExceptionFilter } from './prisma-client-exception/prisma-client-exception.filter';
import { PrismaValidationExceptionFilter } from './prisma-client-exception/prisma-validation-exception.filter';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.useGlobalFilters(
    new PrismaRequestExceptionFilter(),
    new PrismaValidationExceptionFilter(),
  );

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors();
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            `'self'`,
            'data:',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [
            `'self'`,
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );

  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT');
  await app.listen(PORT ?? 3000);
}
bootstrap().catch((error) => console.log(error));
