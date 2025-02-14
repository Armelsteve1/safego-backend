import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.enableCors();
  app.setGlobalPrefix('safego');

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 SafeGo API is running on http://localhost:${port}`);
}
bootstrap();
