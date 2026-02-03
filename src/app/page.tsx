import React from 'react';
import { ArrowRight, Mail, MessageSquare, Calendar, Zap, Shield } from 'lucide-react';
import { Navbar, Footer } from '@/components/layout/Navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="px-8 py-24 bg-gradient-to-br from-primary to-purple-900 text-white overflow-hidden relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8">
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              Automate Your SMB <br />
              <span className="text-accent">Without the Complexity</span>
            </h1>
            <p className="text-xl text-purple-100 max-w-xl">
              FlowStack unifies your communication and scheduling into a single AI-powered platform. 
              Built for founders, sales leads, and operations managers.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-accent text-primary font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform">
                Get Started Free <ArrowRight size={20} />
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold rounded-xl hover:bg-white/20">
                View Products
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="bg-white/5 rounded-3xl p-4 border border-white/10 shadow-2xl">
              <div className="bg-white rounded-2xl overflow-hidden shadow-inner aspect-video flex items-center justify-center text-gray-400 italic">
                Interactive Dashboard Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-8 py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">The FlowStack Suite</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Three powerful tools designed to work together or standalone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* InboxPilot */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Mail size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">InboxPilot</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your AI email assistant. Triage, summarize, and draft replies in your voice automatically.
              </p>
              <a href="/products/inboxpilot" className="text-primary font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
                Learn More <ArrowRight size={18} />
              </a>
            </div>

            {/* ChatFlow */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">ChatFlow</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Turn WhatsApp into your 24/7 business assistant. Automated lead capture and FAQ handling.
              </p>
              <a href="/products/chatflow" className="text-primary font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
                Learn More <ArrowRight size={18} />
              </a>
            </div>

            {/* CalendarSync */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Calendar size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">CalendarSync</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Smart scheduling without the back-and-forth. Real-time sync and auto-booking links.
              </p>
              <a href="/products/calendarsync" className="text-primary font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
                Learn More <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-8 py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-24">
          <div className="flex-1 space-y-12">
            <div className="space-y-4">
              <span className="text-primary font-bold tracking-widest uppercase text-sm">The Platform Standard</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                AI That Sounds <br />
                <span className="text-primary underline decoration-accent underline-offset-8">Exactly Like You</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Stop using generic bots. FlowStack's "User Voice" engine analyzes your historical emails and messages to clone your tone, formality, and linguistic patterns.
              </p>
            </div>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold shrink-0 text-xl italic">1</div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Connect Your History</h4>
                  <p className="text-gray-600 text-lg">One-click integration with Google, Outlook, and WhatsApp. We ingest your sent messages securely.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold shrink-0 text-xl italic">2</div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Extract Your Voice</h4>
                  <p className="text-gray-600 text-lg">Our local LLMs build a custom style profile—mapping your greetings, sign-offs, and professional tone.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold shrink-0 text-xl italic">3</div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Deploy Automated Replies</h4>
                  <p className="text-gray-600 text-lg">Turn on smart triage and auto-drafting. Your assistant handles the volume; you handle the strategy.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/20 rounded-full blur-3xl" />
              <div className="bg-gray-900 rounded-3xl p-8 relative overflow-hidden aspect-square flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-2 w-24 bg-white/20 rounded" />
                  <div className="h-2 w-48 bg-white/10 rounded" />
                </div>
                <div className="flex gap-4 items-end">
                  <Shield className="text-accent" size={48} />
                  <div className="space-y-2 flex-1">
                    <div className="h-2 w-full bg-white/20 rounded" />
                    <div className="h-2 w-2/3 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
