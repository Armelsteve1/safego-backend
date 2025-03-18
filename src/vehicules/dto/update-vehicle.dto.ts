import { PartialType } from '@nestjs/mapped-types';
import { CreateVehiculeDto } from './create-vehicle.dto';

export class UpdateVehicleDto extends PartialType(CreateVehiculeDto) {}
