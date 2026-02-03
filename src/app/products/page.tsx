import React from 'react';
import { Navbar, Footer } from '@/components/layout/Navigation';
import { Mail, MessageSquare, Calendar, ArrowRight } from 'lucide-react';

export default function ProductsPage() {
  const products = [
    {
      id: 'inboxpilot',
      name: 'InboxPilot',
      description: 'AI Email Assistant that drafts replies in your unique voice. Connect Gmail or Outlook and start saving hours every day.',
      icon: <Mail className="text-blue-600" size={32} />,
      link: '/products/inboxpilot',
      cta: 'Personalize My Email'
    },
    {
      id: 'chatflow',
      name: 'ChatFlow',
      description: 'WhatsApp Automation for 24/7 customer service. Ingest your business history to create an AI that knows your products and tone.',
      icon: <MessageSquare className="text-green-600" size={32} />,
      link: '/products/chatflow',
      cta: 'Automate My WhatsApp'
    },
    {
      id: 'calendarsync',
      name: 'CalendarSync',
      description: 'Smart scheduling that understands your priorities. Booking pages that reflect your availability and conversational style.',
      icon: <Calendar className="text-orange-600" size={32} />,
      link: '/products/calendarsync',
      cta: 'Sync My Calendar'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-8 py-24">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">Our Products</h1>
          <p className="text-xl text-gray-600">Choose the tool that fits your workflow.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {products.map((p) => (
            <div key={p.id} className="p-10 border border-gray-100 rounded-[2.5rem] bg-gray-50/50 hover:bg-white hover:shadow-2xl transition-all group flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8">
                  {p.icon}
                </div>
                <h2 className="text-3xl font-bold mb-4">{p.name}</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">{p.description}</p>
              </div>
              <div className="space-y-4">
                <button className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity">
                  {p.cta}
                </button>
                <a href={p.link} className="flex items-center justify-center gap-2 font-bold text-gray-500 hover:text-primary transition-all">
                  Documentation <ArrowRight size={20} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
