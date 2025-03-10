import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsString,
  IsISO8601,
} from 'class-validator';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  departure: string;

  @IsString()
  @IsNotEmpty()
  arrival: string;

  @IsISO8601()
  departureDate: string;

  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsUUID()
  @IsNotEmpty()
  createdById: string;

  @IsString()
  @IsNotEmpty()
  tripDuration: string;

  @IsNumber()
  @Min(1)
  seatsAvailable: number;

  @IsNumber()
  @Min(0)
  price: number;
}
