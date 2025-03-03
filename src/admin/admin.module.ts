import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { CognitoService } from '../auth/cognito.service';
import { CognitoAuthGuard } from '../auth/cognito.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [CognitoService, CognitoAuthGuard, RolesGuard],
})
export class AdminModule {}
