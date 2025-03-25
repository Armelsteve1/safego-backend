import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicule } from './entities/vehicule.entity';
import { CreateVehiculeDto } from './dto/create-vehicle.dto';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicule)
    private vehiclesRepository: Repository<Vehicule>,
    private readonly s3Service: S3Service,
  ) {}

  async createVehicule(
    data: CreateVehiculeDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<Vehicule> {
    try {
      const existingVehicle = await this.vehiclesRepository.findOne({
        where: { registrationNumber: data.registrationNumber },
      });

      if (existingVehicle) {
        throw new ConflictException(
          `A vehicle with registration number "${data.registrationNumber}" already exists.`,
        );
      }

      let imageUrl = null;
      if (file) {
        imageUrl = await this.s3Service.uploadFile(file, 'vehicules');
      }

      const vehicle = this.vehiclesRepository.create({
        ...data,
        userId,
        imageUrl,
        isValidated: false,
      });
      return await this.vehiclesRepository.save(vehicle);
    } catch (error) {
      throw error;
    }
  }

  async findByUser(userId: string): Promise<Vehicule[]> {
    return this.vehiclesRepository.find({ where: { userId } });
  }

  async findPendingValidation(): Promise<Vehicule[]> {
    return this.vehiclesRepository.find({ where: { isValidated: false } });
  }

  async validateVehicle(id: string): Promise<Vehicule> {
    const vehicle = await this.vehiclesRepository.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }

    vehicle.isValidated = true;
    return await this.vehiclesRepository.save(vehicle);
  }
}
