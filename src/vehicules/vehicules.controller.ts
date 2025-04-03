import {
  Controller,
  Post,
  Body,
  Delete,
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicules')
@UseGuards(CognitoAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @ApiOperation({ summary: 'Create a vehicle (Authenticated users)' })
  @ApiResponse({ status: 201, description: 'Vehicle successfully created.' })
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async createVehicule(
    @Body() data: CreateVehiculeDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.vehiclesService.createVehicule(data, req.user.id, file);
  }

  @ApiOperation({ summary: 'Get all vehicles of the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user vehicles.' })
  @Get('my-vehicules')
  async getMyVehicles(@Request() req) {
    return this.vehiclesService.findByUser(req.user.id);
  }

  @ApiOperation({ summary: 'Get all vehicles pending validation (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of vehicles pending validation.',
  })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('pending')
  async getPendingValidation() {
    return this.vehiclesService.findPendingValidation();
  }

  @ApiOperation({ summary: 'Validate a vehicle (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vehicle successfully validated.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('validate/:id')
  async validateVehicle(@Param('id') id: string) {
    return this.vehiclesService.validateVehicle(id);
  }

  @ApiOperation({ summary: 'Update a vehicle (Authenticated users)' })
  @ApiResponse({ status: 200, description: 'Vehicle successfully updated.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  @Patch('update/:id')
  async updateVehicle(
    @Param('id') id: string,
    @Body() data: CreateVehiculeDto,
    @Request() req,
  ) {
    return this.vehiclesService.updateVehicle(id, req.user.id, data);
  }

  @ApiOperation({ summary: 'Delete a vehicle (Authenticated users)' })
  @ApiResponse({ status: 200, description: 'Vehicle successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  @Delete('delete/:id')
  async deleteVehicle(@Param('id') id: string, @Request() req) {
    return this.vehiclesService.deleteVehicle(id, req.user.id);
  }
}
