
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Volume2, Play, Loader2, Music, User, Users } from 'lucide-react';
import { decodeBase64Audio, decodeAudioData } from '../services/geminiService';

const TTSView: React.FC = () => {
  const [text, setText] = useState('Welcome to the Gemini Multi-Modal Hub. I can speak in many different voices!');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voice, setVoice] = useState('Kore');
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleSpeak = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      let config: any = {
        responseModalities: [Modality.AUDIO],
      };

      let finalPrompt = text;

      if (mode === 'single') {
        config.speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        };
      } else {
        finalPrompt = `TTS the following conversation between Joe and Jane:
        Joe: ${text.split('\n')[0] || 'Hello!'}
        Jane: ${text.split('\n')[1] || 'Hi there, how are you?'}`;
        
        config.speechConfig = {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Joe', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
              { speaker: 'Jane', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            ],
          },
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: finalPrompt }] }],
        config,
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const ctx = audioContextRef.current;
        const decoded = decodeBase64Audio(base64Audio);
        const buffer = await decodeAudioData(decoded, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (err) {
      console.error(err);
      alert("Speech synthesis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            <Volume2 className="text-amber-400" size={32} />
            Text to Speech
          </h2>
          <p className="text-slate-400">Natural sounding synthesis with multi-speaker support</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8">
        <div className="flex gap-4">
           <button 
             onClick={() => setMode('single')}
             className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${mode === 'single' ? 'bg-amber-600/10 border-amber-600 text-amber-400 shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-600'}`}
           >
             <User size={24} />
             <span className="text-sm font-bold">Single Speaker</span>
           </button>
           <button 
             onClick={() => setMode('multi')}
             className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${mode === 'multi' ? 'bg-indigo-600/10 border-indigo-600 text-indigo-400 shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-600'}`}
           >
             <Users size={24} />
             <span className="text-sm font-bold">Dialogue Mode</span>
           </button>
        </div>

        {mode === 'single' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map(v => (
              <button 
                key={v}
                onClick={() => setVoice(v)}
                className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${voice === v ? 'bg-slate-800 border-amber-500 text-amber-400' : 'bg-slate-800/30 border-slate-700 text-slate-500'}`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            {mode === 'single' ? 'Text to speak' : 'Dialogue (Enter two lines for Joe and Jane)'}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 min-h-[150px] focus:outline-none focus:border-amber-500 text-slate-100 placeholder-slate-700 resize-none transition-all shadow-inner"
            placeholder={mode === 'single' ? "Type something here..." : "Joe: Hi Jane!\nJane: Hey Joe, what's up?"}
          />
        </div>

        <button
          onClick={handleSpeak}
          disabled={isProcessing || !text.trim()}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
            isProcessing || !text.trim()
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-xl shadow-amber-600/20 active:scale-[0.98]'
          }`}
        >
          {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} />}
          {isProcessing ? 'Synthesizing...' : 'Synthesize & Play'}
        </button>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center">
          <Music size={12} />
          <span>PCM 24kHz Mono Output</span>
        </div>
      </div>
    </div>
  );
};

export default TTSView;
