import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { Vehicule } from '../vehicules/entities/vehicule.entity';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { JwtModule } from '@nestjs/jwt';
import { CognitoAuthGuard } from 'src/auth/cognito.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, User, Vehicule]),
    JwtModule.register({}),
  ],
  providers: [TripService, CognitoAuthGuard],
  controllers: [TripController],
  exports: [TripService],
})
export class TripsModule {}
