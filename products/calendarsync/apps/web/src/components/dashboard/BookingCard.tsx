import React from 'react';
import { Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

interface BookingCardProps {
  title: string;
  duration: number;
  slug: string;
  description: string;
  isAiGenerated?: boolean;
}

export function BookingCard({ title, duration, slug, description, isAiGenerated }: BookingCardProps) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 group-hover:bg-orange-100 transition-colors" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-orange-600 mb-6">
          <Clock size={24} />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">/{slug}</p>
        
        <div className="p-4 bg-orange-50/50 rounded-xl mb-8 space-y-2 border border-orange-100/50">
          <div className="flex items-center gap-2 text-orange-700">
            <Sparkles size={12} className={isAiGenerated ? "fill-orange-700" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isAiGenerated ? "AI Optimized Description" : "Event Description"}
            </span>
          </div>
          <p className="text-xs italic text-gray-600 leading-relaxed">
            "{description}"
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <Clock size={14} /> {duration} min
          </div>
          <button className="text-xs font-bold text-primary hover:underline">Copy Link</button>
        </div>
      </div>
    </div>
  );
}
