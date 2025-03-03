import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'steve@example.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'User password',
  })
  password: string;

  @ApiProperty({
    example: 'user',
    description: 'User role (user, admin, driver, agency)',
  })
  role: string;

  @ApiProperty({ example: 'Steve', description: 'Last name user' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Firt name user',
  })
  lastName: string;

  @ApiProperty({
    example: 'steve123',
    description: 'Name user (unique)',
  })
  username: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'steve@example.com',
    description: 'Email user',
  })
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!', description: 'Password' })
  password: string;
}

export class ConfirmEmailDto {
  @ApiProperty({ example: 'steve123', description: 'Name user' })
  username: string;

  @ApiProperty({
    example: '123456',
    description: 'Confirmation code received by email',
  })
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'steve123', description: 'Name user' })
  username: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'steve123', description: 'Name user' })
  username: string;

  @ApiProperty({
    example: '123456',
    description: 'Reset code received by email',
  })
  code: string;

  @ApiProperty({ example: 'NewP@ssw0rd!', description: 'New password' })
  newPassword: string;
}
