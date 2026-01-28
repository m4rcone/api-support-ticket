import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  Body,
  Res,
} from '@nestjs/common';
import { LoginDto } from './dtos/login.dto';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiTags('Auth')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const user = await this.authService.validateUser(body.email, body.password);
    const { accessToken } = this.authService.login(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      path: '/',
      sameSite: 'lax',
    });
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
