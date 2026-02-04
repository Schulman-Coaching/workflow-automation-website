'use client';

import { useState, useEffect } from 'react';
import { coreRequest } from '@/lib/api';
import { Check, Loader2, Sparkles, Zap, Shield, Rocket } from 'lucide-react';
import { Navbar, Footer } from '@/components/layout/Navigation';

export default function BillingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    coreRequest('/billing/plans')
      .then(data => setPlans(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (priceId: string) => {
    setProcessingId(priceId);
    try {
      const token = localStorage.getItem('flowstack_token');
      const data = await coreRequest('/billing/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        }),
      });
      window.location.href = data.url;
    } catch (err) {
      alert('Failed to start checkout. Are you logged in?');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-8 py-24 w-full">
        <header className="text-center mb-20 space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">Scale Your Voice</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto italic">
            Unlock advanced AI personalization and unlimited automation across all FlowStack tools.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((p) => (
              <div key={p.id} className="bg-white rounded-[3rem] p-10 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between hover:scale-[1.02] transition-transform relative overflow-hidden group">
                {p.id === 'professional' && (
                  <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 rounded-bl-3xl font-bold text-xs uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{p.name}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-primary">${p.amount / 100}</span>
                    <span className="text-gray-400 font-medium">/mo</span>
                  </div>

                  <ul className="space-y-4">
                    {p.features.map((f: string) => (
                      <li key={f} className="flex items-center gap-3 text-gray-600 font-medium">
                        <div className="w-5 h-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                          <Check size={12} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => handleSubscribe(p.id)} // In prod, this uses real Stripe price IDs
                  disabled={!!processingId}
                  className="mt-12 w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-bold text-lg hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {processingId === p.id ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                  Get Started
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
