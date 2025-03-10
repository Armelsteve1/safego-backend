import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Vehicule } from '../../vehicules/entities/vehicule.entity';

@Entity()
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  departure: string;

  @Column()
  arrival: string;

  @Column('timestamp')
  departureDate: Date;

  @Column()
  seatsAvailable: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'validated';

  @ManyToOne(() => Vehicule, (vehicule) => vehicule.trips, { eager: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicule;

  @Column({ type: 'uuid' })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
