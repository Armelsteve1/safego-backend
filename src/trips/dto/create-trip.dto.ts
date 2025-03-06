import { IsString, IsDateString, IsInt, IsUUID } from 'class-validator';

export class CreateTripDto {
  @IsString()
  departure: string;

  @IsString()
  arrival: string;

  @IsDateString()
  departureDate: string;

  @IsInt()
  seatsAvailable: number;

  @IsInt()
  price: number;

  @IsUUID()
  vehicleId: string; // UUID du véhicule
}
