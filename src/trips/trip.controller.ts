import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { TripService } from './trip.service';
import { CognitoAuthGuard } from '../auth/cognito.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateTripDto } from 'src/trips/dto/create-trip.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Trip } from './entities/trip.entity';

@ApiTags('Trips')
@ApiBearerAuth()
@Controller('trips')
@UseInterceptors(ClassSerializerInterceptor)
export class TripController {
  constructor(private readonly tripService: TripService) {}

  /**
   * 🟢 Create a trip
   */
  @ApiOperation({ summary: 'Create a trip (Authenticated users)' })
  @ApiResponse({
    status: 201,
    description: 'Trip successfully created.',
    type: Trip,
  })
  @UseGuards(CognitoAuthGuard)
  @Post()
  async createTrip(
    @Req() req: any,
    @Body() tripData: CreateTripDto,
  ): Promise<Trip> {
    try {
      const userIdFromToken = req.user?.id;
      return await this.tripService.createTrip(userIdFromToken, tripData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 🟢 Retrieve all validated trips
   */
  @ApiOperation({ summary: 'Get all validated trips' })
  @ApiResponse({
    status: 200,
    description: 'List of validated trips.',
    type: [Trip],
  })
  @Get('')
  async getTrips(
    @Query('departure') departure?: string,
    @Query('arrival') arrival?: string,
    @Query('departureDate') departureDate?: string,
  ): Promise<Trip[]> {
    return await this.tripService.getTrips(departure, arrival, departureDate);
  }

  /**
   * 🟢 Retrieve a trip by ID
   */
  @ApiOperation({ summary: 'Get a trip by its ID' })
  @ApiResponse({ status: 200, description: 'Trip details.', type: Trip })
  @ApiResponse({ status: 404, description: 'Trip not found.' })
  @Get(':id')
  async getTripById(@Param('id') id: string) {
    return this.tripService.getTripById(id);
  }

  @ApiOperation({ summary: 'Get all trips created by a user' })
  @ApiResponse({ status: 200, description: 'List of trips.', type: [Trip] })
  @ApiResponse({ status: 404, description: 'No trips found for this user.' })
  @UseGuards(CognitoAuthGuard, RolesGuard)
  @Roles('driver', 'agency')
  @Get('user/:createdById')
  async getTripsByUser(
    @Param('createdById') createdById: string,
  ): Promise<Trip[]> {
    const trips = await this.tripService.findByUsers(createdById);

    if (!trips || trips.length === 0) {
      throw new NotFoundException('No trips found for this user');
    }

    return trips;
  }

  /**
   * 🟢 Validate a trip (Admin only)
   */
  @ApiOperation({ summary: 'Validate a trip (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Trip successfully validated.',
    type: Trip,
  })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  @UseGuards(CognitoAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('validate/:id')
  async validateTrip(@Req() req, @Param('id') id: string) {
    return this.tripService.validateTrip(req.user, id);
  }

  @Patch('endOfTrip/:id')
  async validateOwnTrip(@Req() req: Request, @Param('id') tripId: string) {
    const headers = req.headers as { authorization?: string };
    const accessToken = headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      throw new UnauthorizedException('Missing token');
    }
    return this.tripService.validateOwnTrip(accessToken, tripId);
  }

  /**
   * 🟢 Update a trip (only the creator can do it)
   */
  @ApiOperation({ summary: 'Update a trip (only the creator can do it)' })
  @ApiResponse({
    status: 200,
    description: 'Trip successfully updated.',
    type: Trip,
  })
  @ApiResponse({ status: 404, description: 'Trip not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  @UseGuards(CognitoAuthGuard)
  @Patch(':id')
  async updateTrip(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateData: Partial<Trip>,
  ): Promise<Trip> {
    const userIdFromToken = req.user?.id;
    return this.tripService.updateTrip(userIdFromToken, id, updateData);
  }

  /**
   * 🟢 Delete a trip (only the creator can do it)
   */
  @ApiOperation({ summary: 'Delete a trip (only the creator can do it)' })
  @ApiResponse({
    status: 200,
    description: 'Trip successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Trip not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  @UseGuards(CognitoAuthGuard)
  @Delete('delete/:id')
  async deleteTrip(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const userIdFromToken = req.user?.id;
    return this.tripService.deleteTrip(userIdFromToken, id);
  }
}
