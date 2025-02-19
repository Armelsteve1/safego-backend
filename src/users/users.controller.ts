import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { CognitoAuthGuard } from '../auth/cognito.guard';

@Controller('users')
export class UsersController {
  @UseGuards(CognitoAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    return req.user;
  }
}
