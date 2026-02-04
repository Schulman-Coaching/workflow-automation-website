import Stripe from 'stripe';

export interface PlanConfig {
  id: string;
  name: string;
  amount: number;
  interval: 'month' | 'year';
  description: string;
  features: string[];
}

export const PLATFORM_PLANS: PlanConfig[] = [
  {
    id: 'starter',
    name: 'FlowStack Starter',
    amount: 4900, // $49/mo
    interval: 'month',
    description: 'Perfect for solo founders starting with automation.',
    features: ['1 Email Account', '1 WhatsApp Number', 'Shared Booking Link', 'Basic AI Personalization'],
  },
  {
    id: 'professional',
    name: 'FlowStack Professional',
    amount: 9900, // $99/mo
    interval: 'month',
    description: 'Best for growing SMBs and small teams.',
    features: ['3 Email Accounts', '3 WhatsApp Numbers', 'Custom Booking Pages', 'Advanced User Voice AI'],
  },
  {
    id: 'enterprise',
    name: 'FlowStack Enterprise',
    amount: 24900, // $249/mo
    interval: 'month',
    description: 'Custom automation for larger operations.',
    features: ['Unlimited Accounts', 'Priority AI Processing', 'Dedicated Support', 'Custom Integrations'],
  },
];

export class BillingManager {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    organizationId: string;
  }) {
    // In production, the priceId should be the actual Stripe Price ID (e.g., price_123...)
    // We expect the caller to pass the resolved Stripe Price ID from env vars
    return this.stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { organizationId: params.organizationId },
      subscription_data: { metadata: { organizationId: params.organizationId } },
    });
  }

  async createPortalSession(customerId: string, returnUrl: string) {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  constructEvent(payload: string | Buffer, signature: string, secret: string) {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
