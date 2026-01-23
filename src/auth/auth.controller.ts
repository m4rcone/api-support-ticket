import {
  Controller,
  Request,
  Post,
  HttpStatus,
  HttpCode,
  Body,
} from '@nestjs/common';
import { AuthUserResponseDto } from './dtos/auth-user-response.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto): Promise<AuthUserResponseDto> {
    const user = await this.authService.validateUser(body.email, body.password);

    return {
      name: user.name,
      role: user.role,
    };
  }
}
