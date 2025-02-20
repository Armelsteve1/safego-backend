import { Module } from '@nestjs/common';
import { CognitoService } from './cognito.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { CognitoAuthGuard } from './cognito.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.COGNITO_CLIENT_ID,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [CognitoService, CognitoAuthGuard, JwtStrategy],
  exports: [CognitoService, CognitoAuthGuard, JwtStrategy, JwtModule],
})
export class AuthModule {}
