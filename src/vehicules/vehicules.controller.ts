import { Controller, Post, Get, Body } from '@nestjs/common';
import { VehiclesService } from './vehicules.service';
import { Vehicule } from './entities/vehicule.entity';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @ApiOperation({ summary: 'Create a new vehicle type' })
  @Post()
  async create(
    @Body()
    body: {
      name: string;
      capacity: number;
      registrationNumber: string;
      description?: string;
    },
  ): Promise<Vehicule> {
    return this.vehiclesService.createVehicules(body);
  }

  @ApiOperation({ summary: 'List all available vehicle types' })
  @Get()
  async findAll(): Promise<Vehicule[]> {
    return this.vehiclesService.findAll();
  }
}
