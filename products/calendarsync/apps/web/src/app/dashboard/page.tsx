'use client';

import { useState } from 'react';
import { Calendar, Clock, Link as LinkIcon, Plus, Sparkles, User, Settings, CheckCircle2 } from 'lucide-react';

export default function CalendarSyncDashboard() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Calendar size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">CalendarSync</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm transition-all">
            <Calendar size={18} /> Event Types
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all">
            <Clock size={18} /> Bookings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all">
            <Settings size={18} /> Availability
          </button>
        </nav>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={14} className="fill-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">User Voice Enabled</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">Your booking pages use your unique linguistic profile.</p>
        </div>
      </aside>

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
          {/* Quick Intro Call */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 group-hover:bg-orange-100 transition-colors" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-orange-600 mb-6">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">15 min Intro Call</h3>
              <p className="text-sm text-gray-500 mb-6">/quick-intro</p>
              
              <div className="p-4 bg-orange-50/50 rounded-xl mb-8 space-y-2 border border-orange-100/50">
                <div className="flex items-center gap-2 text-orange-700">
                  <Sparkles size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">AI Description</span>
                </div>
                <p className="text-xs italic text-gray-600 leading-relaxed">
                  "Hey! Excited to potentially chat. Let's grab 15 mins to see if we're a good fit for working together. Talk soon!"
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <LinkIcon size={14} /> Copy Link
                </div>
                <button className="text-xs font-bold text-primary hover:underline">Edit Settings</button>
              </div>
            </div>
          </div>

          {/* Consultation */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors" />
             <div className="relative z-10">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-blue-600 mb-6">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Deep Dive Strategy</h3>
              <p className="text-sm text-gray-500 mb-6">/strategy-session</p>
              
              <div className="p-4 bg-blue-50/50 rounded-xl mb-8 space-y-2 border border-blue-100/50">
                <div className="flex items-center gap-2 text-blue-700">
                  <Sparkles size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">AI Description</span>
                </div>
                <p className="text-xs italic text-gray-600 leading-relaxed">
                  "Looking forward to diving into your workflow. We'll spend 60 mins mapping out your automation roadmap. Best, Elie."
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <LinkIcon size={14} /> Copy Link
                </div>
                <button className="text-xs font-bold text-primary hover:underline">Edit Settings</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
