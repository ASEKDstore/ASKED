import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalFilters(new ZodExceptionFilter());
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.enableCors({
    origin: true,
    credentials: false,
  });

  // Handle shutdown signals
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received');
    await app.close();
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received');
    await app.close();
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API is running on: http://0.0.0.0:${port}`);
}

bootstrap();

