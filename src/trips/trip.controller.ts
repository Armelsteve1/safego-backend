import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpException,
  HttpStatus,
  UnauthorizedException,
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
   * 🟢 Créer un trajet
   */
  @ApiOperation({ summary: 'Créer un trajet (Utilisateurs authentifiés)' })
  @ApiResponse({
    status: 201,
    description: 'Trajet créé avec succès.',
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
   * 🟢 Récupérer tous les trajets validés
   */
  @ApiOperation({ summary: 'Obtenir tous les trajets validés' })
  @ApiResponse({
    status: 200,
    description: 'Liste des trajets validés.',
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
   * 🟢 Récupérer un trajet par ID
   */
  @ApiOperation({ summary: 'Obtenir un trajet par son ID' })
  @ApiResponse({ status: 200, description: 'Détails du trajet.', type: Trip })
  @ApiResponse({ status: 404, description: 'Trajet non trouvé.' })
  @Get(':id')
  async getTripById(@Param('id') id: string) {
    return this.tripService.getTripById(id);
  }

  /**
   * 🟢 Valider un trajet (Admin uniquement)
   */
  @ApiOperation({ summary: 'Valider un trajet (Admin uniquement)' })
  @ApiResponse({
    status: 200,
    description: 'Trajet validé avec succès.',
    type: Trip,
  })
  @ApiResponse({ status: 403, description: 'Accès interdit.' })
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
      throw new UnauthorizedException('Token manquant');
    }
    return this.tripService.validateOwnTrip(accessToken, tripId);
  }
}
