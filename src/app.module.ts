import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, AuthModule, AdminModule],
})
export class AppModule {}
