import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'steve@example.com',
    description: 'Email de l’utilisateur',
  })
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'Mot de passe de l’utilisateur',
  })
  password: string;

  @ApiProperty({
    example: 'user',
    description: 'Rôle de l’utilisateur (user, admin, driver, agency)',
  })
  role: string;

  @ApiProperty({ example: 'Steve', description: 'Prénom de l’utilisateur' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Nom de famille de l’utilisateur',
  })
  lastName: string;

  @ApiProperty({
    example: 'steve123',
    description: 'Nom d’utilisateur (unique)',
  })
  username: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'steve@example.com',
    description: 'Email de l’utilisateur',
  })
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!', description: 'Mot de passe' })
  password: string;
}

export class ConfirmEmailDto {
  @ApiProperty({ example: 'steve123', description: 'Nom d’utilisateur' })
  username: string;

  @ApiProperty({
    example: '123456',
    description: 'Code de confirmation reçu par email',
  })
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'steve123', description: 'Nom d’utilisateur' })
  username: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'steve123', description: 'Nom d’utilisateur' })
  username: string;

  @ApiProperty({
    example: '123456',
    description: 'Code de réinitialisation reçu par email',
  })
  code: string;

  @ApiProperty({ example: 'NewP@ssw0rd!', description: 'Nouveau mot de passe' })
  newPassword: string;
}
