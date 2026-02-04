'use client';

import { useState, useEffect } from 'react';
import { Navbar, Footer } from '@/components/layout/Navigation';
import { 
  Rocket, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  Brain,
  Zap,
  User,
  Loader2,
  Copy
} from 'lucide-react';
import { clsx } from 'clsx';

export default function DemoPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<'pending' | 'ingesting' | 'analyzing' | 'completed'>('pending');
  const [activePersona, setActivePersona] = useState<'founder' | 'support'>('founder');

  // Simulated Training Timer
  useEffect(() => {
    if (trainingStatus === 'ingesting') {
      const timer = setTimeout(() => setTrainingStatus('analyzing'), 3000);
      return () => clearTimeout(timer);
    }
    if (trainingStatus === 'analyzing') {
      const timer = setTimeout(() => setTrainingStatus('completed'), 4000);
      return () => clearTimeout(timer);
    }
  }, [trainingStatus]);

  const handleConnect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmailConnected(true);
      setTrainingStatus('ingesting');
    }, 1500);
  };

  const nextStep = () => setStep(step + 1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 max-w-6xl mx-auto px-8 py-16 w-full">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-16 max-w-2xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
                step >= i ? "bg-primary text-white" : "bg-white text-gray-300 border border-gray-200"
              )}>
                {step > i ? <CheckCircle2 size={20} /> : i}
              </div>
              {i < 3 && <div className={clsx("w-24 h-1 mx-4 rounded", step > i ? "bg-primary" : "bg-gray-200")} />}
            </div>
          ))}
        </div>

        {/* Step 1: Signup & Identity */}
        {step === 1 && (
          <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Rocket size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Sign Up Demo</h1>
              <p className="text-gray-500">Experience the central platform onboarding.</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input readOnly value="Elie Schulman" className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-gray-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Organization</label>
                  <input readOnly value="Schulman Coaching" className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-gray-500 focus:outline-none" />
                </div>
              </div>
              <button onClick={nextStep} className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                Continue to Product Hub <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: The Hub & AI Training */}
        {step === 2 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">Your Product Hub</h1>
              <p className="text-gray-500 text-lg">One identity. Three powerful AI tools.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* InboxPilot Card - The Active One */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-primary relative overflow-hidden group">
                <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                  Action Required
                </div>
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Mail size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-2">InboxPilot</h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">Connect your email to start the User Voice training engine.</p>
                
                {!emailConnected ? (
                  <button 
                    onClick={handleConnect}
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Connect Gmail"}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end text-sm mb-1">
                      <span className="font-bold text-gray-700 capitalize">{trainingStatus}...</span>
                      <span className="text-primary font-bold">
                        {trainingStatus === 'ingesting' ? '35%' : trainingStatus === 'analyzing' ? '75%' : '100%'}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: trainingStatus === 'ingesting' ? '35%' : trainingStatus === 'analyzing' ? '75%' : '100%' }}
                      />
                    </div>
                    {trainingStatus === 'completed' && (
                      <button onClick={nextStep} className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 animate-bounce">
                        Launch Dashboard <Rocket size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ChatFlow (Disabled) */}
              <div className="bg-white/50 p-8 rounded-[2.5rem] border border-gray-100 opacity-60 grayscale cursor-not-allowed">
                <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquare size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-2">ChatFlow</h3>
                <p className="text-sm text-gray-400 mb-8">WhatsApp automation. Locked until account verification.</p>
              </div>

              {/* CalendarSync (Disabled) */}
              <div className="bg-white/50 p-8 rounded-[2.5rem] border border-gray-100 opacity-60 grayscale cursor-not-allowed">
                <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-6">
                  <Calendar size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-2">CalendarSync</h3>
                <p className="text-sm text-gray-400 mb-8">Smart scheduling links. Build your booking page.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: High-Fidelity Personalization Reveal */}
        {step === 3 && (
          <div className="space-y-12 animate-in fade-in zoom-in duration-700">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-primary font-bold tracking-widest uppercase text-sm">
                <Sparkles size={16} fill="currentColor" /> Training Complete
              </div>
              <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">Your AI Voice is Active</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                FlowStack has analyzed your last 50 emails. Select a persona below to see how the AI adapts.
              </p>
            </div>

            {/* Persona Switcher */}
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setActivePersona('founder')}
                className={clsx(
                  "px-8 py-3 rounded-full font-bold transition-all border-2",
                  activePersona === 'founder' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                )}
              >
                The Concise Founder
              </button>
              <button 
                onClick={() => setActivePersona('support')}
                className={clsx(
                  "px-8 py-3 rounded-full font-bold transition-all border-2",
                  activePersona === 'support' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                )}
              >
                The Warm Support Lead
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Profile Panel */}
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-primary">
                    <Brain size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Linguistic Profile</h3>
                    <p className="text-sm text-gray-500">Auto-extracted from history</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tone</span>
                    <span className="font-bold text-gray-900">{activePersona === 'founder' ? 'Direct & Outcome-Oriented' : 'Empathetic & Detailed'}</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Formality</span>
                    <span className="font-bold text-gray-900">{activePersona === 'founder' ? '3/10 (Casual-Direct)' : '7/10 (Professional)'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Negative Constraints</span>
                  <div className="flex flex-wrap gap-2">
                    {(activePersona === 'founder' ? ['Avoids pleasantries', 'No emojis', 'No "Best regards"'] : ['Avoids short replies', 'No negative framing', 'No jargon']).map(c => (
                      <span key={c} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">NEVER: {c}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Draft Reveal */}
              <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap size={120} />
                </div>
                
                <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest block">Incoming Email</span>
                    <p className="text-gray-400 italic">"Hi Elie, can we jump on a quick call to discuss the pricing for the enterprise deal? We have a few questions."</p>
                  </div>

                  <div className="h-px bg-white/10 w-full" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-white/90 px-2 py-1 rounded">FlowStack AI Draft</span>
                      <Copy size={16} className="text-gray-500 cursor-pointer hover:text-white" />
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl min-h-[120px] font-mono text-sm leading-relaxed">
                      {activePersona === 'founder' ? (
                        "Makes sense. Pushing this to Friday at 2 PM. Send over the specific questions before then so I can prep. See ya."
                      ) : (
                        "Hope you're having a wonderful week! I'd be absolutely delighted to jump on a call and clarify those pricing details for you. How does Thursday afternoon look on your end? Looking forward to making this a success together!"
                      )}
                    </div>
                  </div>

                  <button className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent hover:text-primary transition-all shadow-xl shadow-primary/20">
                    Apply to Live Account <Rocket size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
