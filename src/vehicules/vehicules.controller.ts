import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { VehiclesService } from './vehicules.service';
import { CreateVehiculeDto } from './dto/create-vehicle.dto';
import { CognitoAuthGuard } from '../auth/cognito.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('vehicules')
@UseGuards(CognitoAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async createVehicule(
    @Body() data: CreateVehiculeDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.vehiclesService.createVehicule(data, req.user.id, file);
  }

  @Get('my-vehicules')
  async getMyVehicles(@Request() req) {
    return this.vehiclesService.findByUser(req.user.id);
  }

  // ✅ Route pour récupérer les véhicules en attente de validation (Admin uniquement)
  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getPendingValidation() {
    return this.vehiclesService.findPendingValidation();
  }

  // ✅ Route pour valider un véhicule (Admin uniquement)
  @Patch('validate/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async validateVehicle(@Param('id') id: string) {
    return this.vehiclesService.validateVehicle(id);
  }
}
