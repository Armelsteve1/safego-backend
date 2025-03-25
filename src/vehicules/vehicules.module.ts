import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicules.service';
import { VehiclesController } from './vehicules.controller';
import { Vehicule } from './entities/vehicule.entity';
import { S3Module } from '../s3/s3.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicule]),
    JwtModule.register({}),
    S3Module,
  ],
  providers: [VehiclesService],
  controllers: [VehiclesController],
  exports: [VehiclesService, TypeOrmModule],
})
export class VehiclesModule {}
