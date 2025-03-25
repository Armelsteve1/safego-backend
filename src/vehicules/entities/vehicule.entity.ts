import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

export enum VehicleType {
  CAR = 'car',
  BUS = 'bus',
  VAN = 'van',
  TRUCK = 'truck',
}

export enum VehicleCategory {
  ECONOMY = 'economy',
  LUXURY = 'luxury',
  STANDARD = 'standard',
}

@Entity()
export class Vehicule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  capacity: number;

  @Column({ unique: true })
  registrationNumber: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.CAR })
  type: VehicleType;

  @Column({
    type: 'enum',
    enum: VehicleCategory,
    default: VehicleCategory.STANDARD,
  })
  category: VehicleCategory;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ default: false })
  isValidated: boolean;

  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips: Trip[];
}
