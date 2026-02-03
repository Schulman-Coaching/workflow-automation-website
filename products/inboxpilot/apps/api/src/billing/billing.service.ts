import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  // Default pricing - $29/month
  private readonly PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_default';
  private readonly PRODUCT_NAME = 'InboxPilot Pro';
  private readonly PRICE_MONTHLY = 2900; // $29.00 in cents

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('billing.stripe.secretKey');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });
    } else {
      this.logger.warn('Stripe secret key not configured');
    }
  }

  async getSubscription(organizationId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) {
      return null;
    }

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEnd: subscription.trialEnd,
    };
  }

  async createCheckoutSession(
    organizationId: string,
    userEmail: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    // Get or create Stripe customer
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // Check if already subscribed
    if (organization.subscription?.status === 'active') {
      throw new BadRequestException('Organization already has an active subscription');
    }

    let customerId = organization.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await this.stripe.customers.create({
        email: userEmail,
        metadata: {
          organizationId,
          organizationName: organization.name,
        },
      });
      customerId = customer.id;

      // Save customer ID to organization
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Get or create the price
    const priceId = await this.getOrCreatePrice();

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
      },
      subscription_data: {
        metadata: {
          organizationId,
        },
      },
    });

    this.logger.log(`Created checkout session ${session.id} for org ${organizationId}`);

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createPortalSession(organizationId: string, returnUrl: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization?.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  }

  async cancelSubscription(organizationId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!subscription) {
      throw new BadRequestException('No subscription found');
    }

    // Cancel at period end (not immediately)
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { organizationId },
      data: { cancelAtPeriodEnd: true },
    });

    this.logger.log(`Subscription canceled for org ${organizationId}`);

    return { success: true, cancelAtPeriodEnd: true };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const webhookSecret = this.configService.get<string>('billing.stripe.webhookSecret');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) {
      this.logger.warn('No organizationId in checkout session metadata');
      return;
    }

    this.logger.log(`Checkout completed for org ${organizationId}`);

    // Subscription will be created via subscription.created webhook
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) {
      this.logger.warn('No organizationId in subscription metadata');
      return;
    }

    const subscriptionItem = subscription.items.data[0];
    const priceId = subscriptionItem?.price?.id;
    // In newer Stripe API, period data is on subscription items
    const currentPeriodStart = subscriptionItem?.current_period_start;
    const currentPeriodEnd = subscriptionItem?.current_period_end;

    await this.prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId || '',
        status: subscription.status,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : new Date(),
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      },
      update: {
        status: subscription.status,
        stripePriceId: priceId || undefined,
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : undefined,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
      },
    });

    this.logger.log(`Subscription ${subscription.status} for org ${organizationId}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) {
      this.logger.warn('No organizationId in subscription metadata');
      return;
    }

    await this.prisma.subscription.update({
      where: { organizationId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    this.logger.log(`Subscription deleted for org ${organizationId}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const organization = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (organization) {
      this.logger.warn(`Payment failed for org ${organization.id}`);
      // Could send notification email here
    }
  }

  private async getOrCreatePrice(): Promise<string> {
    // Check if price ID is configured
    const configuredPriceId = process.env.STRIPE_PRICE_ID;
    if (configuredPriceId && configuredPriceId !== 'price_default') {
      return configuredPriceId;
    }

    // Create product and price if not exists
    try {
      // Try to find existing product
      const products = await this.stripe.products.list({
        active: true,
        limit: 1,
      });

      let productId: string;

      if (products.data.length > 0 && products.data[0].name === this.PRODUCT_NAME) {
        productId = products.data[0].id;
      } else {
        // Create new product
        const product = await this.stripe.products.create({
          name: this.PRODUCT_NAME,
          description: 'AI-powered email assistant for professionals',
        });
        productId = product.id;
        this.logger.log(`Created Stripe product: ${productId}`);
      }

      // Find or create price
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
        limit: 1,
      });

      if (prices.data.length > 0) {
        return prices.data[0].id;
      }

      // Create new price
      const price = await this.stripe.prices.create({
        product: productId,
        unit_amount: this.PRICE_MONTHLY,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });

      this.logger.log(`Created Stripe price: ${price.id}`);
      return price.id;
    } catch (error) {
      this.logger.error(`Failed to get/create price: ${error.message}`);
      throw new BadRequestException('Failed to initialize billing');
    }
  }
}
