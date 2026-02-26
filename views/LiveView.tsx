
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, Loader2, Sparkles, Activity, AlertCircle } from 'lucide-react';
import { encodeUint8ArrayToBase64, decodeBase64Audio, decodeAudioData } from '../services/geminiService';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<{role: string, text: string}[]>([]);
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = () => {
    if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
    }
    if (audioContextInRef.current) {
        audioContextInRef.current.close();
        audioContextInRef.current = null;
    }
    setIsActive(false);
  };

  const startSession = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextInRef.current = inCtx;
      audioContextOutRef.current = outCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const base64 = encodeUint8ArrayToBase64(new Uint8Array(int16.buffer));
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
              const txt = message.serverContent.outputTranscription.text;
              setTranscriptions(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'model') {
                  return [...prev.slice(0, -1), { role: 'model', text: last.text + txt }];
                }
                return [...prev, { role: 'model', text: txt }];
              });
            }
            if (message.serverContent?.inputTranscription) {
              const txt = message.serverContent.inputTranscription.text;
              setTranscriptions(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user') {
                  return [...prev.slice(0, -1), { role: 'user', text: last.text + txt }];
                }
                return [...prev, { role: 'user', text: txt }];
              });
            }

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const decoded = decodeBase64Audio(audioData);
              const buffer = await decodeAudioData(decoded, outCtx, 24000, 1);
              
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live session error", e);
            setError("Connection error occurred.");
            stopSession();
          },
          onclose: () => {
            console.log("Session closed");
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are a friendly real-time assistant. Keep your responses concise and natural.'
        }
      });

      sessionRef.current = await sessionPromise;
      setIsActive(true);
    } catch (err) {
      console.error(err);
      setError("Failed to start session. Check microphone permissions.");
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="h-full flex flex-col p-8 max-w-4xl mx-auto overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            <Mic className="text-emerald-400" size={32} />
            Live Multimodal
          </h2>
          <p className="text-slate-400">Human-like low-latency voice interaction</p>
        </div>
        <div className="flex items-center gap-3">
           {isActive && (
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
               <Activity size={12} className="animate-pulse" />
               LIVE
             </div>
           )}
           <button
             onClick={isActive ? stopSession : startSession}
             className={`p-4 rounded-full transition-all shadow-xl active:scale-90 ${
               isActive 
                 ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20' 
                 : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
             }`}
           >
             {isActive ? <MicOff size={28} /> : <Mic size={28} />}
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {transcriptions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                 <Mic size={32} className="text-slate-700" />
              </div>
              <p className="max-w-xs">Tap the mic to start a natural conversation with Gemini. Talk about anything!</p>
            </div>
          ) : (
            transcriptions.map((t, i) => (
              <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  t.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  <span className="font-bold mr-2 uppercase text-[10px] opacity-70">
                    {t.role === 'user' ? 'You' : 'Gemini'}
                  </span>
                  {t.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800">
           {error ? (
             <div className="flex items-center gap-2 text-red-400 text-xs justify-center">
               <AlertCircle size={14} /> {error}
             </div>
           ) : isActive ? (
             <div className="flex justify-center items-center space-x-4">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-1 bg-emerald-500 rounded-full animate-bounce`} style={{ animationDelay: `${i * 100}ms`, height: `${Math.random() * 20 + 10}px` }}></div>
                  ))}
                </div>
                <span className="text-slate-400 text-xs font-medium italic">Listening and thinking...</span>
             </div>
           ) : (
             <p className="text-center text-slate-500 text-xs font-medium">Session inactive</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default LiveView;
