import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

@Entity()
export class TripReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trip, (trip) => trip.reviews, { onDelete: 'CASCADE' })
  trip: Trip;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'numeric', precision: 2, scale: 1 })
  rating: number;

  @Column({ nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt: Date;
}

export default TripReview;
