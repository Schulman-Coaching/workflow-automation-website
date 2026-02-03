import Link from 'next/link';
import { Mail, Zap, Clock, Inbox } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 to-navy-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-8 w-8 text-sky-400" />
            <span className="text-xl font-bold text-white">InboxPilot</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-300 hover:text-white"
            >
              Sign in
            </Link>
            <Link href="/auth/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
          Your AI Email Assistant
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-300">
          Stop drowning in email. InboxPilot uses AI to triage your inbox,
          draft responses, and keep you focused on what matters.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
            Start Free Trial
          </Link>
          <Link
            href="#features"
            className="btn bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-3"
          >
            Learn More
          </Link>
        </div>

        {/* Features */}
        <section id="features" className="mt-32 grid gap-8 md:grid-cols-3">
          <div className="card bg-white/5 border-white/10 text-left">
            <div className="mb-4 inline-flex rounded-lg bg-sky-500/20 p-3">
              <Inbox className="h-6 w-6 text-sky-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Smart Inbox Triage
            </h3>
            <p className="text-gray-400">
              AI automatically categorizes and prioritizes your emails so you
              know what needs attention first.
            </p>
          </div>

          <div className="card bg-white/5 border-white/10 text-left">
            <div className="mb-4 inline-flex rounded-lg bg-sky-500/20 p-3">
              <Zap className="h-6 w-6 text-sky-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              AI Draft Assistant
            </h3>
            <p className="text-gray-400">
              Generate professional email responses in seconds with AI that
              learns your writing style.
            </p>
          </div>

          <div className="card bg-white/5 border-white/10 text-left">
            <div className="mb-4 inline-flex rounded-lg bg-sky-500/20 p-3">
              <Clock className="h-6 w-6 text-sky-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Follow-Up Autopilot
            </h3>
            <p className="text-gray-400">
              Never miss a follow-up. AI detects when emails need responses and
              reminds you automatically.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-32 rounded-2xl bg-sky-500/10 border border-sky-500/20 p-12">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to take control of your inbox?
          </h2>
          <p className="mb-8 text-lg text-gray-300">
            Join thousands of professionals who save hours every week with
            InboxPilot.
          </p>
          <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
            Start Your Free Trial
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-sky-400" />
            <span className="font-semibold text-white">InboxPilot</span>
          </div>
          <p className="text-sm text-gray-400">
            Part of the FlowStack suite
          </p>
        </div>
      </footer>
    </div>
  );
}
