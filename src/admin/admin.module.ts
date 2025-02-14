import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // 🔥 Vérifie que User est bien importé
  controllers: [AdminController], // 🔥 Vérifie que AdminController est bien ajouté
})
export class AdminModule {}
