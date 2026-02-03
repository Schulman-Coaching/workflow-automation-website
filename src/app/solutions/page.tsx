import React from 'react';
import { Navbar, Footer } from '@/components/layout/Navigation';
import { Briefcase, TrendingUp, Cpu, Database, ArrowRight } from 'lucide-react';

export default function SolutionsPage() {
  const solutions = [
    {
      id: 'customer-service',
      title: 'Customer Service',
      description: 'Scale your support without adding headcount.',
      icon: <Briefcase className="text-purple-600" size={32} />
    },
    {
      id: 'sales-automation',
      title: 'Sales Automation',
      description: 'Respond to leads instantly, 24/7 on any channel.',
      icon: <TrendingUp className="text-purple-600" size={32} />
    },
    {
      id: 'operations',
      title: 'Operations Streamlining',
      description: 'Eliminate manual data entry and coordination tasks.',
      icon: <Cpu className="text-purple-600" size={32} />
    },
    {
      id: 'data-integration',
      title: 'Data Integration',
      description: 'Connect your siloed tools into a unified workflow.',
      icon: <Database className="text-purple-600" size={32} />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-8 py-24">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">Automation Solutions</h1>
          <p className="text-xl text-gray-600">Built for every part of your business.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
          {solutions.map((s) => (
            <div key={s.id} className="p-12 bg-purple-50 rounded-3xl space-y-6 hover:bg-purple-100 transition-colors group">
              <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">{s.icon}</div>
              <h2 className="text-3xl font-bold">{s.title}</h2>
              <p className="text-lg text-gray-600 max-w-sm mx-auto">{s.description}</p>
              <button className="flex items-center gap-2 mx-auto font-bold text-primary group-hover:gap-4 transition-all uppercase tracking-widest text-sm">
                Explore Solution <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
