import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Enable jobs worker when --worker flag is passed (e.g. node dist/main --worker)
if (process.argv.includes('--worker')) {
  process.env.JOBS_WORKER_ENABLED = 'true';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3001'];
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for the application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.use(
    '/docs',
    apiReference({
      content: document,
      cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest',
      theme: 'elysiajs',
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}
void bootstrap();
