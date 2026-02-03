'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout/Navigation';
import { Mail, MessageSquare, Calendar, Sparkles, LogOut, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('flowstack_user');
    const token = localStorage.getItem('flowstack_token');
    if (!storedUser || !token) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('flowstack_token');
    localStorage.removeItem('flowstack_user');
    router.push('/login');
  };

  const products = [
    {
      id: 'inboxpilot',
      name: 'InboxPilot',
      description: 'Your AI email assistant is ready.',
      icon: <Mail className="text-blue-600" size={32} />,
      url: 'http://localhost:3003/dashboard'
    },
    {
      id: 'chatflow',
      name: 'ChatFlow',
      description: 'Automate your WhatsApp workflows.',
      icon: <MessageSquare className="text-green-600" size={32} />,
      url: 'http://localhost:3005/dashboard'
    },
    {
      id: 'calendarsync',
      name: 'CalendarSync',
      description: 'Personalized scheduling links.',
      icon: <Calendar className="text-orange-600" size={32} />,
      url: 'http://localhost:3007/dashboard'
    }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-100 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <span className="font-bold text-xl">FlowStack</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-8 py-16 w-full">
        <header className="mb-12 space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-gray-500 text-lg">Select a tool to start automating your workflow.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((p) => (
            <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between group hover:border-primary/50 transition-all">
              <div>
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  {p.icon}
                </div>
                <h2 className="text-2xl font-bold mb-2">{p.name}</h2>
                <p className="text-gray-500 mb-8">{p.description}</p>
              </div>
              <button 
                onClick={() => window.open(p.url, '_blank')}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary transition-all"
              >
                Launch Tool <ArrowUpRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
