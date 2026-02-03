import React from 'react';
import { Navbar, Footer } from '@/components/layout/Navigation';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: '$29',
      description: 'Perfect for solo founders and small teams.',
      features: ['1 Email Account', 'Basic Inbox Triage', 'AI Draft Assistant', 'Standard Support']
    },
    {
      name: 'Professional',
      price: '$49',
      description: 'For growing businesses with high volume.',
      features: ['Unlimited Email Accounts', 'Advanced AI Training', 'WhatsApp Integration', 'Priority Support'],
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Tailored solutions for large organizations.',
      features: ['Dedicated AI Training', 'SAML SSO', 'Full Suite Integration', 'Account Manager']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-8 py-24">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Invest in your time. Automate the rest.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`p-10 rounded-3xl border ${plan.highlighted ? 'border-primary shadow-2xl scale-105 relative z-10' : 'border-gray-100 shadow-sm'} flex flex-col space-y-8`}>
              {plan.highlighted && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Most Popular</div>}
              <div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-500">{plan.description}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-gray-500">/mo</span>}
              </div>
              <ul className="space-y-4 flex-1 text-gray-600">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check className="text-green-500" size={20} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-xl font-bold transition-all ${plan.highlighted ? 'bg-primary text-white hover:opacity-90' : 'bg-gray-50 text-primary hover:bg-gray-100'}`}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
