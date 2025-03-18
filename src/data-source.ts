import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Trip } from './trips/entities/trip.entity';
import { Vehicule } from './vehicules/entities/vehicule.entity';
import { TripReview } from './reviews/entities/trip-review.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'safego',
  entities: [Trip, Vehicule, TripReview], // ✅ Ajout de `TripReview`
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});

export default AppDataSource;
