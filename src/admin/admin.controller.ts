import { Controller, Patch, Param, UseGuards, Get } from '@nestjs/common';
import { CognitoService } from '../auth/cognito.service';
import { CognitoAuthGuard } from '../auth/cognito.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(CognitoAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly cognitoService: CognitoService) {}

  @ApiOperation({ summary: 'Validate a Driver or Agency account' })
  @ApiResponse({ status: 200, description: 'User successfully validated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Patch('validate/:username')
  @Roles('admin')
  async validateUser(@Param('username') username: string) {
    return this.cognitoService.validateUser(username);
  }

  @ApiOperation({ summary: 'Verify a user profile' })
  @ApiResponse({ status: 200, description: 'User successfully verified' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Patch('verify/:username')
  @Roles('admin')
  async verifyUser(@Param('username') username: string) {
    return this.cognitoService.verifyUser(username);
  }

  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Get('users')
  @Roles('admin')
  async listUsers() {
    return this.cognitoService.listUsers();
  }

  @ApiOperation({ summary: 'List users pending validation' })
  @ApiResponse({
    status: 200,
    description: 'Pending users retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Get('pending-validation')
  @Roles('admin')
  async listPendingValidationUsers() {
    return this.cognitoService.listPendingValidationUsers();
  }
}
