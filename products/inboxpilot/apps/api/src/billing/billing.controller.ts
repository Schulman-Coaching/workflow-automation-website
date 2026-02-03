import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Headers,
  RawBodyRequest,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface CreateCheckoutDto {
  successUrl: string;
  cancelUrl: string;
}

interface CreatePortalDto {
  returnUrl: string;
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@CurrentUser() user: { organizationId: string }) {
    const subscription = await this.billingService.getSubscription(user.organizationId);

    return {
      success: true,
      data: subscription,
    };
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @CurrentUser() user: { organizationId: string; email: string },
    @Body() dto: CreateCheckoutDto,
  ) {
    const result = await this.billingService.createCheckoutSession(
      user.organizationId,
      user.email,
      dto.successUrl,
      dto.cancelUrl,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortal(
    @CurrentUser() user: { organizationId: string },
    @Body() dto: CreatePortalDto,
  ) {
    const result = await this.billingService.createPortalSession(
      user.organizationId,
      dto.returnUrl,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@CurrentUser() user: { organizationId: string }) {
    const result = await this.billingService.cancelSubscription(user.organizationId);

    return {
      success: true,
      data: result,
    };
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const result = await this.billingService.handleWebhook(req.rawBody!, signature);

    return result;
  }
}
