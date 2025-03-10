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

  @Column({ type: 'interval', nullable: true })
  tripDuration: string;

  @Column()
  seatsAvailable: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'validated';

  @ManyToOne(() => Vehicule, (vehicule) => vehicule.trips, { eager: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicule;

  @Column({ type: 'uuid' }) // Stocke uniquement l'ID de l'utilisateur
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
