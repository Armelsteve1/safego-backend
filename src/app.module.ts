import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { TripsModule } from './trips/trips.module';
import { VehiclesModule } from './vehicules/vehicules.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripReview } from './reviews/entities/trip-review.entity';
import { Trip } from './trips/entities/trip.entity';
import { Vehicle } from './entities/vehicle.entity';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([Trip, TripReview, Vehicle]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AdminModule,
    VehiclesModule,
    TripsModule,
  ],
})
export class AppModule {}
