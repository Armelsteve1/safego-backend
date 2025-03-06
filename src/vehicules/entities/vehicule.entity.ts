import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

@Entity()
@Unique(['registrationNumber'])
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

  @Column({ type: 'text', array: true, nullable: true })
  images?: string[];

  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips: Trip[];
}
