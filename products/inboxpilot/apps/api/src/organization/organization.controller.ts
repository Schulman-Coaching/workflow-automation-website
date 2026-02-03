import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '@/auth/decorators/current-user.decorator';

@Controller('organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  async getOrganization(@CurrentUser() user: CurrentUserData) {
    const org = await this.organizationService.findById(user.organizationId);
    return {
      success: true,
      data: org,
    };
  }

  @Patch()
  async updateOrganization(
    @CurrentUser() user: CurrentUserData,
    @Body() data: { name?: string; settings?: Record<string, unknown> },
  ) {
    const org = await this.organizationService.update(user.organizationId, data);
    return {
      success: true,
      data: org,
    };
  }

  @Get('members')
  async getMembers(@CurrentUser() user: CurrentUserData) {
    const members = await this.organizationService.getMembers(
      user.organizationId,
    );
    return {
      success: true,
      data: members,
    };
  }
}
