import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { BillingManager, PLATFORM_PLANS } from '@flowstack/billing';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private billingManager: BillingManager;
  private stripe: Stripe; // Used for direct operations not in manager

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.billingManager = new BillingManager(secretKey);
      this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
    }
  }

  async getPlans() {
    return PLATFORM_PLANS;
  }

  async createCheckoutSession(organizationId: string, priceId: string, successUrl: string, cancelUrl: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new BadRequestException('Organization not found');

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        name: org.name,
        metadata: { organizationId },
      });
      customerId = customer.id;
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    return this.billingManager.createCheckoutSession({
      customerId,
      priceId,
      successUrl,
      cancelUrl,
      organizationId,
    });
  }

  async handleWebhook(payload: any, signature: string) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.billingManager.constructEvent(payload, signature, secret);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata.organizationId;

      await this.prisma.subscription.upsert({
        where: { organizationId },
        create: {
          organizationId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        update: {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }

    return { received: true };
  }
}
