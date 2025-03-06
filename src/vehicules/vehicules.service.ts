import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicule } from './entities/vehicule.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicule)
    private vehiclesRepository: Repository<Vehicule>,
  ) {}

  async createVehicules(data: {
    name: string;
    capacity: number;
    registrationNumber: string;
    description?: string;
  }): Promise<Vehicule> {
    try {
      const existingVehicle = await this.vehiclesRepository.findOne({
        where: { registrationNumber: data.registrationNumber },
      });

      if (existingVehicle) {
        throw new ConflictException(
          `A vehicle with registration number "${data.registrationNumber}" already exists.`,
        );
      }

      const vehicle = this.vehiclesRepository.create(data);
      return await this.vehiclesRepository.save(vehicle);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          'A vehicle with this registration number already exists.',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Vehicule[]> {
    return this.vehiclesRepository.find();
  }
}
