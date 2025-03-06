import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicules.service';
import { VehiclesController } from './vehicules.controller';
import { Vehicule } from './entities/vehicule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicule])],
  providers: [VehiclesService],
  controllers: [VehiclesController],
  exports: [VehiclesService, TypeOrmModule],
})
export class VehiclesModule {}
