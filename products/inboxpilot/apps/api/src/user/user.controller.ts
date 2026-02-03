import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '@/auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserData) {
    const profile = await this.userService.findById(user.id);
    return {
      success: true,
      data: profile,
    };
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() data: { name?: string; avatarUrl?: string },
  ) {
    const profile = await this.userService.updateProfile(user.id, data);
    return {
      success: true,
      data: profile,
    };
  }

  @Patch('me/settings')
  async updateSettings(
    @CurrentUser() user: CurrentUserData,
    @Body() settings: Record<string, unknown>,
  ) {
    const profile = await this.userService.updateSettings(user.id, settings);
    return {
      success: true,
      data: profile,
    };
  }
}
