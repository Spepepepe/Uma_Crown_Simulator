import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getUserData(@CurrentUser() userId: string) {
    return this.authService.getUserData(userId);
  }
}
