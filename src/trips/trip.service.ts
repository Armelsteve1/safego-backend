import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './entities/trip.entity';
import { Vehicule } from '../vehicules/entities/vehicule.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { CognitoService } from 'src/auth/cognito.service';
import { UserRole } from 'src/common/user-role.enum';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Vehicule)
    private readonly vehicleRepository: Repository<Vehicule>,

    private readonly authService: CognitoService,
  ) {}

  /**
   * 🔥 1️⃣ Créer un trajet (User Cognito uniquement)
   */
  async createTrip(
    accessToken: string,
    tripData: CreateTripDto,
  ): Promise<Trip> {
    const cognitoUser = await this.authService.getUserFromCognito(accessToken);

    const userIdFromCognito = cognitoUser.UserAttributes.find(
      (attr) => attr.Name === 'sub',
    )?.Value;

    const givenName =
      cognitoUser.UserAttributes.find((attr) => attr.Name === 'given_name')
        ?.Value || '';
    const familyName =
      cognitoUser.UserAttributes.find((attr) => attr.Name === 'family_name')
        ?.Value || '';
    const userName = `${givenName} ${familyName}`.trim() || 'Inconnu';

    const userProfilePicture =
      cognitoUser.UserAttributes.find((attr) => attr.Name === 'picture')
        ?.Value || null;

    const userRole =
      cognitoUser.UserAttributes.find((attr) => attr.Name === 'custom:role')
        ?.Value || 'driver';

    if (userRole === 'admin') {
      throw new ForbiddenException(
        'Un administrateur ne peut pas créer un trajet',
      );
    }

    if (!userIdFromCognito) {
      throw new ForbiddenException('Authentification utilisateur invalide');
    }

    const vehicle = await this.vehicleRepository.findOne({
      where: { id: tripData.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Véhicule non trouvé');
    }

    const existingTrip = await this.tripRepository.findOne({
      where: { vehicle: { id: tripData.vehicleId }, status: 'pending' },
    });

    if (existingTrip) {
      throw new ConflictException(
        'Ce véhicule est déjà affecté à un trajet en attente',
      );
    }

    const tripType = userRole === 'agency' ? 'agence' : 'covoiturage';

    const newTrip = this.tripRepository.create({
      departure: tripData.departure,
      arrival: tripData.arrival,
      departureDate: new Date(tripData.departureDate),
      departureTime: tripData.departureTime,
      arrivalTime: tripData.arrivalTime,
      seatsAvailable: tripData.seatsAvailable,
      price: tripData.price,
      status: 'pending',
      createdById: userIdFromCognito,
      vehicle,
      driverName: userName,
      driverProfilePicture: userProfilePicture,
      isValidated: false,
      tripType,
    });

    return await this.tripRepository.save(newTrip);
  }

  /**
   * 🔥 2️⃣ Récupérer tous les trajets validés
   */
  async getTrips(
    departure?: string,
    arrival?: string,
    departureDate?: string,
  ): Promise<Trip[]> {
    const query = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .where('trip.status != :validated', { validated: 'validated' })
      .andWhere('trip.departureDate >= CURRENT_DATE');

    query.andWhere(
      `(trip.departureDate > CURRENT_DATE OR (trip.departureDate = CURRENT_DATE AND trip.departureTime >= CURRENT_TIME))`,
    );

    if (departure) {
      query.andWhere('LOWER(trip.departure) LIKE LOWER(:departure)', {
        departure: `%${departure}%`,
      });
    }

    if (arrival) {
      query.andWhere('LOWER(trip.arrival) LIKE LOWER(:arrival)', {
        arrival: `%${arrival}%`,
      });
    }

    if (departureDate) {
      query.andWhere('trip.departureDate = :departureDate', {
        departureDate,
      });
    }

    return await query.getMany();
  }

  /**
   * 🔥 3️⃣ Récupérer un trajet par ID
   */
  async getTripById(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async findByUsers(createdById: string): Promise<Trip[]> {
    return this.tripRepository.find({
      where: { createdById },
      relations: ['vehicle'],
    });
  }

  /**
   * 🔥 4️⃣ Modifier un trajet (seul le créateur peut le faire)
   */
  async updateTrip(
    userId: string,
    id: string,
    updateData: Partial<Trip>,
  ): Promise<Trip> {
    const trip = await this.tripRepository.findOne({ where: { id } });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.createdById !== userId) {
      throw new ForbiddenException('You can only update your own trips');
    }

    Object.assign(trip, updateData);
    return await this.tripRepository.save(trip);
  }

  /**
   * 🔥 5️⃣ Supprimer un trajet (seul le créateur peut le faire)
   */
  async deleteTrip(userId: string, id: string): Promise<{ message: string }> {
    const trip = await this.tripRepository.findOne({ where: { id } });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own trips');
    }

    await this.tripRepository.delete(id);
    return { message: 'Trip deleted successfully' };
  }

  /**
   * 🔥 6️⃣ Valider un trajet (Admin uniquement)
   */
  async validateTrip(user: { role: string }, tripId: string): Promise<Trip> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can validate trips');
    }

    const trip = await this.tripRepository.findOne({ where: { id: tripId } });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    trip.isValidated = true;
    return await this.tripRepository.save(trip);
  }

  async validateOwnTrip(accessToken: string, tripId: string): Promise<Trip> {
    const cognitoUser =
      await this.authService.getUserNameFromCognito(accessToken);
    const userId = cognitoUser.UserAttributes.find(
      (attr) => attr.Name === 'sub',
    )?.Value;

    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException('Trajet non trouvé');
    }

    if (trip.createdById !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez valider que vos propres trajets',
      );
    }
    trip.status = 'validated';
    return await this.tripRepository.save(trip);
  }
}
