import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet()); // Sécurisation des headers
  app.enableCors(); // Autorisation des requêtes cross-origin
  app.setGlobalPrefix('api'); // Préfixe d’API

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 SafeGo API is running on http://localhost:${port}`);
}
bootstrap();
