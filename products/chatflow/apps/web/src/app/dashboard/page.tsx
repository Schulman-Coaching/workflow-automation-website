'use client';

import { useState } from 'react';
import { MessageSquare, Phone, Shield, Sparkles, User, Search, Filter, MoreVertical } from 'lucide-react';
import { clsx } from 'clsx';

export default function ChatFlowDashboard() {
  const [activeTab, setActiveTab] = useState('chats');

  const chats = [
    { id: 1, name: '+1 (555) 012-3456', lastMessage: 'Checking on the status of my order...', time: '12m ago', unread: true, category: 'action_required' },
    { id: 2, name: '+44 20 7946 0958', lastMessage: 'Thank you for the quick reply!', time: '1h ago', unread: false, category: 'fyi' },
    { id: 3, name: '+61 2 9876 5432', lastMessage: 'Can you help me with a return?', time: '3h ago', unread: false, category: 'urgent' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-20 bg-gray-900 flex flex-col items-center py-8 gap-8">
        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white">
          <MessageSquare size={24} />
        </div>
        <div className="flex flex-col gap-6 text-gray-400">
          <button className="p-3 bg-white/10 rounded-xl text-white"><MessageSquare size={20} /></button>
          <button className="p-3 hover:bg-white/5 rounded-xl transition-colors"><Phone size={20} /></button>
          <button className="p-3 hover:bg-white/5 rounded-xl transition-colors"><Shield size={20} /></button>
        </div>
      </aside>

      {/* Chat List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <header className="p-6 border-b border-gray-100 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input className="w-full bg-gray-50 border border-gray-100 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20" placeholder="Search conversations..." />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div key={chat.id} className={clsx("p-4 border-b border-gray-50 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors", chat.unread && "bg-green-50/30")}>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                <User size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-gray-900 truncate">{chat.name}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                <div className="mt-2">
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    chat.category === 'urgent' ? "bg-red-50 text-red-600" :
                    chat.category === 'action_required' ? "bg-orange-50 text-orange-600" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    {chat.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main View */}
      <main className="flex-1 flex flex-col bg-white">
        <header className="px-8 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">+1 (555) 012-3456</h2>
              <p className="text-xs text-green-500">AI Personalization Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100">
              <Sparkles size={16} /> User Voice Training
            </button>
            <button className="p-2 text-gray-400"><MoreVertical size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-md border border-gray-100">
              <p className="text-gray-800">Hi there! Checking on the status of my order #8472.</p>
              <span className="text-[10px] text-gray-400 mt-2 block uppercase font-bold tracking-widest">Client · 10:42 AM</span>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-green-600 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-md text-white">
              <div className="flex items-center gap-2 mb-2 text-green-100">
                <Sparkles size={12} /> <span className="text-[10px] font-bold uppercase tracking-widest">AI Suggestion</span>
              </div>
              <p>Hi! Let me check that for you right away. I see order #8472 is currently with our carrier and should be delivered by tomorrow afternoon. Hope that helps!</p>
              <div className="mt-4 flex gap-2">
                <button className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">Send Now</button>
                <button className="px-3 py-1.5 bg-transparent border border-white/20 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors">Edit Draft</button>
              </div>
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-gray-100 bg-white">
          <div className="flex gap-4">
            <input className="flex-1 bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20" placeholder="Type a message..." />
            <button className="bg-green-600 text-white px-8 rounded-2xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20">Send</button>
          </div>
        </footer>
      </main>
    </div>
  );
}
