import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; role?: UserRole },
  ) {
    const existingUser = await this.userRepository.findOne({
      where: { email: body.email },
    });
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await this.authService.hashPassword(body.password);
    let isValidated = true;
    if (body.role === UserRole.DRIVER || body.role === UserRole.AGENCY) {
      isValidated = false;
    }

    const user = this.userRepository.create({
      email: body.email,
      password: hashedPassword,
      role: body.role || UserRole.USER,
      isValidated,
    });

    await this.userRepository.save(user);
    return {
      message: 'User registered successfully',
      requiresValidation: !isValidated,
    };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.userRepository.findOne({
      where: { email: body.email },
      select: ['id', 'email', 'password', 'role', 'isValidated', 'isVerified'],
    });

    if (
      !user ||
      !(await this.authService.comparePasswords(body.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: await this.authService.generateToken(user),
      isVerified: user.isVerified,
      isValidated: user.isValidated,
    };
  }
}
