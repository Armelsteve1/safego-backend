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

  @Column('date', { default: () => 'CURRENT_DATE' })
  departureDate: Date;

  @Column('time', { default: '00:00:00' })
  departureTime: string = '00:00:00';

  @Column('time', { nullable: true })
  arrivalTime?: string;

  @Column()
  seatsAvailable: number = 1;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number = 0;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'validated' = 'pending';

  @Column({ type: 'boolean', default: false })
  isValidated: boolean;

  @ManyToOne(() => Vehicule, (vehicule) => vehicule.trips, { eager: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicule;

  @Column({ type: 'uuid' })
  createdById: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @Column({ default: 'Conducteur inconnu' })
  driverName: string;

  @Column({ type: 'numeric', precision: 2, scale: 1, nullable: true })
  driverRating?: number;

  @Column({ nullable: true })
  driverProfilePicture?: string;

  @Column({ type: 'varchar', length: 20 })
  tripType: 'covoiturage' | 'agence';

  @OneToMany(() => TripReview, (review) => review.trip, { cascade: true })
  reviews?: TripReview[];
}
