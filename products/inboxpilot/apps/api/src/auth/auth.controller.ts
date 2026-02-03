import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, CurrentUserData } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);
    return {
      success: true,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserData) {
    const profile = await this.authService.getProfile(user.id);
    return {
      success: true,
      data: profile,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    // For JWT, logout is typically handled client-side by removing the token
    // If using refresh tokens stored in DB, we would invalidate them here
    return {
      success: true,
      data: { message: 'Logged out successfully' },
    };
  }
}
