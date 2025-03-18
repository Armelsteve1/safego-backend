import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehiclesService } from './vehicules.service';
import { CreateVehiculeDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('vehicules')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createVehiculeDto: CreateVehiculeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.vehiclesService.createVehicule(createVehiculeDto, file);
  }

  @Get()
  async findAll() {
    return this.vehiclesService.findAll();
  }

  @Patch(':id/category')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.updateCategory(id, updateDto.category);
  }
}
