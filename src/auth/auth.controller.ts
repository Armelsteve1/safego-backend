import { Controller, Post, Body, Delete, Req, UseGuards } from '@nestjs/common';
import { CognitoService } from './cognito.service';
import { CognitoAuthGuard } from './cognito.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  RegisterDto,
  LoginDto,
  ConfirmEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly cognitoService: CognitoService) {}

  @ApiOperation({ summary: 'Inscription d’un utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur inscrit avec succès' })
  @ApiResponse({ status: 400, description: 'Email déjà utilisé' })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.cognitoService.signUp(
      body.email,
      body.password,
      body.role,
      body.firstName,
      body.lastName,
      body.username,
    );
  }

  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.cognitoService.signIn(body.email, body.password);
  }

  @ApiOperation({ summary: 'Confirmer l’email après l’inscription' })
  @Post('confirm-email')
  async confirmEmail(@Body() body: ConfirmEmailDto) {
    return this.cognitoService.confirmSignUp(body.username, body.code);
  }

  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe' })
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.cognitoService.forgotPassword(body.username);
  }

  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.cognitoService.resetPassword(
      body.username,
      body.code,
      body.newPassword,
    );
  }

  @ApiBearerAuth()
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Supprimer un compte utilisateur' })
  @Delete('delete-account')
  async deleteAccount(@Req() req) {
    return this.cognitoService.deleteAccount(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Déconnexion de l’utilisateur' })
  @Post('logout')
  async logout(@Req() req) {
    return this.cognitoService.logout(req.user.accessToken);
  }
}
