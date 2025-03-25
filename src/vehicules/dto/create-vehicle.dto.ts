import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { VehicleType, VehicleCategory } from '../entities/vehicule.entity';

export class CreateVehiculeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  capacity: number;

  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsEnum(VehicleCategory)
  category: VehicleCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
