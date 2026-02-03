import React from 'react';
import { Navbar, Footer } from '@/components/layout/Navigation';
import { Mail, MessageSquare, Calendar, ArrowRight } from 'lucide-react';

export default function ProductsPage() {
  const products = [
    {
      id: 'inboxpilot',
      name: 'InboxPilot',
      description: 'AI Email Assistant for SMBs.',
      icon: <Mail className="text-blue-600" size={32} />,
      link: '/products/inboxpilot'
    },
    {
      id: 'chatflow',
      name: 'ChatFlow',
      description: 'WhatsApp Automation for 24/7 service.',
      icon: <MessageSquare className="text-green-600" size={32} />,
      link: '/products/chatflow'
    },
    {
      id: 'calendarsync',
      name: 'CalendarSync',
      description: 'Smart scheduling and meeting sync.',
      icon: <Calendar className="text-orange-600" size={32} />,
      link: '/products/calendarsync'
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
            <div key={p.id} className="p-8 border border-gray-100 rounded-3xl hover:shadow-2xl transition-all group">
              <div className="mb-6">{p.icon}</div>
              <h2 className="text-3xl font-bold mb-4">{p.name}</h2>
              <p className="text-gray-600 mb-8">{p.description}</p>
              <a href={p.link} className="flex items-center gap-2 font-bold text-primary group-hover:gap-4 transition-all">
                View Details <ArrowRight size={20} />
              </a>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
