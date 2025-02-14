import { Controller, Patch, Param, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

@Controller('admin') // 🔥 Vérifie que c'est bien 'admin'
export class AdminController {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Patch('validate/:id') // 🔥 Vérifie que le nom correspond bien à la requête
  async validateUser(@Param('id') userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isValidated = true;
    await this.userRepository.save(user);

    return { message: 'User validated successfully' };
  }
}
