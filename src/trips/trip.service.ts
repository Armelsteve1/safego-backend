import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { Vehicule } from '../vehicules/entities/vehicule.entity';
import { UserRole } from '../common/user-role.enum';
import { CreateTripDto } from './dto/create-trip.dto';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Vehicule)
    private vehicleRepository: Repository<Vehicule>,
  ) {}

  /**
   * 🔥 1️⃣ Créer un trajet (Driver ou Agency)
   */
  async createTrip(user: any, tripData: CreateTripDto): Promise<Trip> {
    const allowedRoles = ['Driver', 'Agency'];
    const userHasRole = user.groups.some((group) =>
      allowedRoles.includes(group),
    );

    if (!userHasRole) {
      throw new ForbiddenException(
        'Only drivers and agencies can create trips',
      );
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

    const newTrip = new Trip();
    newTrip.departure = tripData.departure;
    newTrip.arrival = tripData.arrival;
    newTrip.departureDate = new Date(tripData.departureDate);
    newTrip.seatsAvailable = tripData.seatsAvailable;
    newTrip.price = tripData.price;
    newTrip.status = 'pending';
    newTrip.createdById = user.id;
    newTrip.vehicle = vehicle;

    return await this.tripRepository.save(newTrip);
  }

  /**
   * 🔥 2️⃣ Récupérer tous les trajets disponibles
   */
  async getTrips(): Promise<Trip[]> {
    return await this.tripRepository.find({
      where: { status: 'validated' },
      relations: ['createdBy', 'vehicle'],
    });
  }

  /**
   * 🔥 3️⃣ Récupérer un trajet par ID
   */
  async getTripById(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['createdBy', 'vehicle'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  /**
   * 🔥 4️⃣ Modifier un trajet (seul le créateur peut le faire)
   */
  async updateTrip(user: User, id: string, updateData): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!trip) throw new NotFoundException('Trip not found');

    if (trip.createdById !== user.id) {
      throw new ForbiddenException('You can only update your own trips');
    }

    Object.assign(trip, updateData);
    return await this.tripRepository.save(trip);
  }

  /**
   * 🔥 5️⃣ Supprimer un trajet (seul le créateur peut le faire)
   */
  async deleteTrip(user: User, id: string): Promise<{ message: string }> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!trip) throw new NotFoundException('Trip not found');

    if (trip.createdById !== user.id) {
      throw new ForbiddenException('You can only delete your own trips');
    }

    await this.tripRepository.delete(id);
    return { message: 'Trip deleted successfully' };
  }

  /**
   * 🔥 6️⃣ Valider un trajet (Admin uniquement)
   */
  async validateTrip(user: User, id: string): Promise<Trip> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can validate trips');
    }

    const trip = await this.tripRepository.findOne({ where: { id } });
    if (!trip) throw new NotFoundException('Trip not found');

    trip.status = 'validated';
    return await this.tripRepository.save(trip);
  }

  /**
   * 🔥 7️⃣ Lister les trajets en attente de validation (Admin)
   */
  async getPendingTrips(user: User): Promise<Trip[]> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view pending trips');
    }

    return await this.tripRepository.find({
      where: { status: 'pending' },
      relations: ['createdBy', 'vehicle'],
    });
  }
}
