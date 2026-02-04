'use client';

import { useState } from 'react';
import { Calendar, Clock, Link as LinkIcon, Plus, Sparkles, User, Settings, CheckCircle2 } from 'lucide-react';
import { BookingCard } from '@/components/dashboard/BookingCard';

export default function CalendarSyncDashboard() {
  const [eventTypes, setEventTypes] = useState([
    {
      id: '1',
      title: '15 min Intro Call',
      duration: 15,
      slug: 'quick-intro',
      description: 'Hey! Excited to potentially chat. Let\'s grab 15 mins to see if we\'re a good fit for working together. Talk soon!',
      isAiGenerated: true
    },
    {
      id: '2',
      title: 'Deep Dive Strategy',
      duration: 60,
      slug: 'strategy-session',
      description: 'Looking forward to diving into your workflow. We\'ll spend 60 mins mapping out your automation roadmap. Best, Elie.',
      isAiGenerated: true
    }
  ]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar (omitted for brevity) */}
      <main className="flex-1 overflow-y-auto p-12">
        <header className="flex justify-between items-center mb-12">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">Event Types</h1>
            <p className="text-gray-500">Create scheduling links that reflect your personal brand.</p>
          </div>
          <button className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Plus size={20} /> New Event Type
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eventTypes.map((event) => (
            <BookingCard key={event.id} {...event} />
          ))}
        </div>
      </main>
    </div>
  );
}
