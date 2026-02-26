
import React from 'react';
import { AppView } from '../types';
import { MessageSquare, Image, Volume2, Mic, Play, Sparkles, Search, Map } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: AppView.CHAT,
      title: 'Smart Chat',
      description: 'Conversational AI with search grounding and reasoning capabilities.',
      icon: MessageSquare,
      color: 'blue',
      tag: 'Pro'
    },
    {
      id: AppView.IMAGE_GEN,
      title: 'Visual Studio',
      description: 'Generate stunning imagery using Gemini 2.5 Flash and Pro models.',
      icon: Image,
      color: 'purple',
      tag: 'New'
    },
    {
      id: AppView.LIVE,
      title: 'Live Audio',
      description: 'Experience ultra-low latency multimodal voice conversations.',
      icon: Mic,
      color: 'emerald',
      tag: 'Experimental'
    },
    {
      id: AppView.TTS,
      title: 'Text to Speech',
      description: 'Natural sounding multi-speaker voice synthesis for your text.',
      icon: Volume2,
      color: 'amber',
      tag: 'Audio'
    },
    {
      id: AppView.VIDEO,
      title: 'Video Engine',
      description: 'Transform prompts and images into dynamic high-quality video.',
      icon: Play,
      color: 'rose',
      tag: 'Veo'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          Experience the <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Gemini Ecosystem</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Unlock the full potential of Google's most capable AI models. From real-time reasoning to high-fidelity creative generation, explore what's possible.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className="group relative flex flex-col text-left p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-300"
          >
            <div className={`p-3 rounded-2xl mb-4 w-fit bg-${card.color}-500/10 text-${card.color}-400 group-hover:scale-110 transition-transform`}>
              <card.icon size={24} />
            </div>
            <div className="absolute top-6 right-6 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:bg-blue-600 group-hover:text-white transition-colors">
              {card.tag}
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{card.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-blue-900/20 to-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center space-x-2 text-blue-400 mb-3 font-semibold uppercase tracking-wider text-xs">
              <Sparkles size={16} />
              <span>Grounding Capabilities</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Real-time Search & Mapping</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Gemini models are now integrated with Google Search and Maps. Access up-to-the-minute information and location data directly within your conversations.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                <Search size={18} className="text-blue-400" />
                <span className="text-sm">Google Search Grounding</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                <Map size={18} className="text-emerald-400" />
                <span className="text-sm">Google Maps Grounding</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 flex justify-center">
             <div className="relative">
                <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full"></div>
                <img src="https://picsum.photos/seed/gemini/400/300" alt="Tech" className="relative rounded-2xl border border-slate-700 shadow-2xl" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
