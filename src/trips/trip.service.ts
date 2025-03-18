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
    const userName =
      cognitoUser.UserAttributes.find((attr) => attr.Name === 'name')?.Value ||
      'Inconnu';
    const userProfilePicture =
      cognitoUser.UserAttributes.find((attr) => attr.Name === 'picture')
        ?.Value || null;

    if (!userIdFromCognito) {
      throw new ForbiddenException('Invalid user authentication');
    }

    const vehicle = await this.vehicleRepository.findOne({
      where: { id: tripData.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const existingTrip = await this.tripRepository.findOne({
      where: { vehicle: { id: tripData.vehicleId }, status: 'pending' },
    });

    if (existingTrip) {
      throw new ConflictException(
        'This vehicle is already assigned to a pending trip.',
      );
    }
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
      .where('trip.status = :status', { status: 'validated' });

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
      query.andWhere('DATE(trip.departureDate) = :departureDate', {
        departureDate,
      });
    }

    const trips = await query.getMany();
    return trips;
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

  /**
   * 🔥 4️⃣ Modifier un trajet (seul le créateur peut le faire)
   */
  async updateTrip(userId: string, id: string, updateData): Promise<Trip> {
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
  async validateTrip(user: any, id: string): Promise<Trip> {
    if (!user || !user.groups || user.groups.length === 0) {
      throw new ForbiddenException('User role is missing or invalid.');
    }

    const userRole = user.groups[0].toLowerCase();
    if (userRole !== UserRole.ADMIN.toLowerCase()) {
      throw new ForbiddenException('Only admins can validate trips');
    }

    const trip = await this.tripRepository.findOne({ where: { id } });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    trip.status = 'validated';
    return await this.tripRepository.save(trip);
  }

  /**
   * 🔥 7️⃣ Lister les trajets en attente de validation (Admin)
   */
  async getPendingTrips(user: any): Promise<Trip[]> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view pending trips');
    }

    return this.tripRepository.find({
      where: { status: 'pending' },
      relations: ['vehicle'],
    });
  }
}
