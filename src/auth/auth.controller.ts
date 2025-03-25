import {
  Controller,
  Post,
  Body,
  Delete,
  Req,
  UseGuards,
  Get,
  Put,
  UnauthorizedException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CognitoService } from './cognito.service';
import { CognitoAuthGuard } from './cognito.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import * as jwt from 'jsonwebtoken';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly cognitoService: CognitoService,
    private readonly s3Service: S3Service,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      role: string;
      family_name?: string;
      given_name?: string;
      agencyName?: string;
    },
  ) {
    return this.cognitoService.signUp(
      body.email,
      body.password,
      body.role,
      body.family_name,
      body.given_name,
      body.agencyName,
    );
  }
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.cognitoService.signIn(body.email, body.password);
  }

  @ApiOperation({ summary: 'Confirm email verification' })
  @Post('confirm-email')
  async confirmEmail(@Body() body: { username: string; code: string }) {
    return this.cognitoService.confirmSignUp(body.username, body.code);
  }

  @ApiOperation({ summary: 'Forgot password' })
  @Post('forgot-password')
  async forgotPassword(@Body() body: { username: string }) {
    return this.cognitoService.forgotPassword(body.username);
  }

  @ApiOperation({ summary: 'Reset password' })
  @Post('reset-password')
  async resetPassword(
    @Body() body: { username: string; code: string; newPassword: string },
  ) {
    return this.cognitoService.resetPassword(
      body.username,
      body.code,
      body.newPassword,
    );
  }

  @ApiOperation({ summary: 'Delete user account (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(CognitoAuthGuard)
  @Delete('delete-account')
  async deleteAccount(@Req() req) {
    return this.cognitoService.deleteAccount(req.user.id);
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiBearerAuth()
  @UseGuards(CognitoAuthGuard)
  @Post('logout')
  async logout(@Req() req) {
    return this.cognitoService.logout(req.user?.accessToken);
  }

  @ApiOperation({ summary: 'Refresh token' })
  @ApiBearerAuth()
  @UseGuards(CognitoAuthGuard)
  @Post('refresh-token')
  async refresh(@Body() body: { refreshToken: string; username: string }) {
    return this.cognitoService.refreshToken(body.refreshToken, body.username);
  }
  /**
   * 🔍 Récupérer les informations de l'utilisateur connecté
   */
  @UseGuards(CognitoAuthGuard)
  @Get('profile')
  async getUserProfile(@Req() req) {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      throw new UnauthorizedException('Token manquant');
    }
    return this.cognitoService.getUserInfo(accessToken);
  }
  @UseGuards(CognitoAuthGuard)
  @Put('profile/update')
  async updateUserProfile(
    @Req() req,
    @Body() updateData: Record<string, string>,
  ) {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken) {
      throw new UnauthorizedException('Token manquant');
    }
    const allowedAttributes = [
      'given_name',
      'family_name',
      'phone_number',
      'custom:agencyName',
      'picture',
    ];

    const attributes = Object.entries(updateData)
      .filter(([key]) => allowedAttributes.includes(key))
      .map(([key, value]) => ({ Name: key, Value: value }));

    if (attributes.length === 0) {
      throw new BadRequestException('Aucune donnée valide à mettre à jour.');
    }

    return this.cognitoService.updateUserInfo(accessToken, attributes);
  }

  @Put('profile/picture')
  @UseInterceptors(FileInterceptor('picture'))
  async updateUserPicture(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    if (!accessToken || !file) {
      throw new BadRequestException('Token ou image manquant');
    }

    const imageUrl = await this.s3Service.uploadFile(file, 'users');
    await this.cognitoService.updateUserInfo(accessToken, [
      { Name: 'picture', Value: imageUrl },
    ]);
    return { picture: imageUrl };
  }
}
