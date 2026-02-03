import React from 'react';
import { Zap } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="text-2xl font-bold text-primary flex items-center gap-2">
        <a href="/" className="flex items-center gap-2">
          <Zap className="text-accent fill-accent" />
          <span>FlowStack</span>
        </a>
      </div>
      <div className="hidden md:flex space-x-8 text-gray-600 font-medium">
        <a href="/products" className="hover:text-primary">Products</a>
        <a href="/solutions" className="hover:text-primary">Solutions</a>
        <a href="/pricing" className="hover:text-primary">Pricing</a>
        <a href="/resources" className="hover:text-primary">Resources</a>
      </div>
      <div className="flex space-x-4">
        <button className="px-6 py-2 text-primary font-semibold hover:bg-gray-50 rounded-lg">Log In</button>
        <button className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90">Get a Demo</button>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16 px-8 mt-24">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 border-b border-gray-800 pb-12 mb-12">
        <div className="col-span-2 md:col-span-1 space-y-6">
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="text-accent fill-accent" />
            <span>FlowStack</span>
          </div>
          <p>Empowering SMBs with professional-grade automation.</p>
        </div>
        <div className="space-y-4">
          <h5 className="text-white font-bold">Products</h5>
          <ul className="space-y-2">
            <li><a href="/products/inboxpilot" className="hover:text-white">InboxPilot</a></li>
            <li><a href="/products/chatflow" className="hover:text-white">ChatFlow</a></li>
            <li><a href="/products/calendarsync" className="hover:text-white">CalendarSync</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h5 className="text-white font-bold">Company</h5>
          <ul className="space-y-2">
            <li><a href="/about" className="hover:text-white">About Us</a></li>
            <li><a href="/careers" className="hover:text-white">Careers</a></li>
            <li><a href="/contact" className="hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h5 className="text-white font-bold">Legal</h5>
          <ul className="space-y-2">
            <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
            <li><a href="/terms" className="hover:text-white">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 FlowStack Automation. All rights reserved.</p>
      </div>
    </footer>
  );
}
