import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TripService } from './trip.service';
import { CognitoAuthGuard } from '../auth/cognito.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Trips')
@ApiBearerAuth()
@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @ApiOperation({ summary: 'Create a trip' })
  @UseGuards(CognitoAuthGuard)
  @Post()
  async createTrip(@Req() req, @Body() tripData) {
    return this.tripService.createTrip(req.user, tripData);
  }

  @ApiOperation({ summary: 'Get all validated trips' })
  @Get()
  async getTrips() {
    return this.tripService.getTrips();
  }

  @ApiOperation({ summary: 'Get a trip by ID' })
  @Get(':id')
  async getTripById(@Param('id') id: string) {
    return this.tripService.getTripById(id);
  }

  @ApiOperation({ summary: 'Validate a trip (Admin only)' })
  @UseGuards(CognitoAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/validate')
  async validateTrip(@Req() req, @Param('id') id: string) {
    return this.tripService.validateTrip(req.user, id);
  }
}
