import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Vehicule } from '../../vehicules/entities/vehicule.entity';
import { TripReview } from '../../reviews/entities/trip-review.entity';

@Entity()
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  departure: string = '';

  @Column()
  arrival: string = '';

  @Column('date', { default: () => 'CURRENT_DATE' }) // ✅ Défaut pour éviter NULL
  departureDate: Date;

  @Column('time', { default: '00:00:00' }) // ✅ Défaut pour éviter NULL
  departureTime: string = '00:00:00';

  @Column('time', { nullable: true })
  arrivalTime?: string;

  @Column()
  seatsAvailable: number = 1;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number = 0;

  @Column({ default: 'pending' })
  status: 'pending' | 'validated' = 'pending';

  @ManyToOne(() => Vehicule, (vehicule) => vehicule.trips, { eager: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicule;

  @Column({ type: 'uuid' })
  createdById: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @Column({ default: 'Conducteur inconnu' }) // ✅ Ajout de valeur par défaut
  driverName: string;

  @Column({ type: 'numeric', precision: 2, scale: 1, nullable: true })
  driverRating?: number;

  @Column({ nullable: true })
  driverProfilePicture?: string;

  // ✅ Correction de la relation avec TripReview
  @OneToMany(() => TripReview, (review) => review.trip, { cascade: true })
  reviews?: TripReview[];
}
