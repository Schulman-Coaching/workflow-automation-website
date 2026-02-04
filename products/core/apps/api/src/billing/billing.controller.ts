import { Controller, Get, Post, Body, Headers, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '@flowstack/auth';

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(@Req() req: any, @Body() body: { priceId: string, successUrl: string, cancelUrl: string }) {
    return this.billingService.createCheckoutSession(
      req.user.organizationId,
      body.priceId,
      body.successUrl,
      body.cancelUrl
    );
  }

  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    return this.billingService.handleWebhook(req.rawBody, signature);
  }
}
