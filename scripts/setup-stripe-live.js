const Stripe = require('stripe');

async function setupStripeLive() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY is missing');
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);

  const plans = [
    {
      id: 'starter',
      name: 'FlowStack Starter',
      amount: 4900,
      description: '1 Email Account, 1 WhatsApp Number, Shared Booking Link',
    },
    {
      id: 'professional',
      name: 'FlowStack Professional',
      amount: 9900,
      description: '3 Email Accounts, 3 WhatsApp Numbers, Custom Booking Pages',
    },
    {
      id: 'enterprise',
      name: 'FlowStack Enterprise',
      amount: 24900,
      description: 'Unlimited Accounts, Priority AI, Dedicated Support',
    },
  ];

  console.log('💳 Initializing Stripe Live Mode Products...');

  for (const plan of plans) {
    try {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { platform_plan_id: plan.id }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: 'usd',
        recurring: { interval: 'month' },
      });

      console.log(`✅ ${plan.name} Created:`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID:   ${price.id}`);
      console.log(`   Set STRIPE_PRICE_${plan.id.toUpperCase()}=${price.id}`);
      console.log('---');
    } catch (error) {
      console.error(`❌ Failed to create ${plan.name}: ${error.message}`);
    }
  }

  console.log('\n🚀 Stripe initialization complete.');
}

setupStripeLive();
