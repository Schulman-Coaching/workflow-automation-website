import React from 'react';
import { Brain, CheckCircle2, Loader2, MessageSquare, Sparkles } from 'lucide-react';

interface TrainingProgressProps {
  status: 'pending' | 'ingesting' | 'analyzing' | 'completed' | 'failed';
  styleProfile?: {
    tone?: string;
    formality?: string;
    commonPhrases?: string[];
  };
}

export function TrainingProgress({ status, styleProfile }: TrainingProgressProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ingesting':
        return {
          icon: <Loader2 className="animate-spin text-blue-500" />,
          label: 'Ingesting History',
          description: 'Syncing your last 90 days of emails...',
          progress: 35
        };
      case 'analyzing':
        return {
          icon: <Brain className="text-purple-500" />,
          label: 'Analyzing Voice',
          description: 'Our AI is learning your linguistic patterns...',
          progress: 75
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="text-green-500" />,
          label: 'Training Complete',
          description: 'Your AI model is ready to draft in your voice.',
          progress: 100
        };
      case 'failed':
        return {
          icon: <Sparkles className="text-red-500" />,
          label: 'Training Paused',
          description: 'Something went wrong. Click to retry.',
          progress: 0
        };
      default:
        return {
          icon: <Sparkles className="text-gray-400" />,
          label: 'Awaiting Training',
          description: 'Connect an account to start AI personalization.',
          progress: 0
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            User Voice Training
            {status === 'completed' && <Sparkles size={18} className="text-accent fill-accent" />}
          </h3>
          <p className="text-gray-500 text-sm">{config.description}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-2xl">
          {config.icon}
        </div>
      </div>

      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-600">{config.label}</span>
            <span className="text-primary">{config.progress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${config.progress}%` }}
            />
          </div>
        </div>

        {/* Style Profile Preview */}
        {status === 'completed' && styleProfile && (
          <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-2xl space-y-1">
              <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">Primary Tone</span>
              <p className="text-gray-900 font-semibold">{styleProfile.tone || 'Professional'}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl space-y-1">
              <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Formality</span>
              <p className="text-gray-900 font-semibold">{styleProfile.formality || 'Medium'}</p>
            </div>
            <div className="col-span-2 p-4 bg-gray-50 rounded-2xl space-y-2">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <MessageSquare size={12} /> Common Phrases
              </span>
              <div className="flex flex-wrap gap-2">
                {(styleProfile.commonPhrases || ['Best regards', 'Let me know', 'Checking in']).map((phrase) => (
                  <span key={phrase} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">
                    "{phrase}"
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
