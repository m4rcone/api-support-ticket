import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  Body,
  Res,
} from '@nestjs/common';
import { AuthUserResponseDto } from './dtos/auth-user-response.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUserResponseDto> {
    const user = await this.authService.validateUser(body.email, body.password);
    const { accessToken } = this.authService.login(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 10, // 10 min
      path: '/',
      sameSite: 'lax',
    });

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
    });
  }
}
