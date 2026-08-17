import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendPort = process.env.FRONTEND_PORT ?? '5173';
  app.enableCors({
    origin: [`http://localhost:${frontendPort}`, 'http://localhost:5173'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
