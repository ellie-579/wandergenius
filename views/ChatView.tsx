
import React, { useState, useRef, useEffect } from 'react';
import { generateText } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, Loader2, Search, Map as MapIcon, Link as LinkIcon, AlertCircle, Sparkles } from 'lucide-react';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [useMaps, setUseMaps] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const tools = [];
      if (useSearch) tools.push({ googleSearch: {} });
      if (useMaps) tools.push({ googleMaps: {} });

      // If maps is used, we need a 2.5 model as per rules
      const model = useMaps ? 'gemini-2.5-flash-lite-latest' : 'gemini-3-flash-preview';
      
      const response = await generateText(input, model, tools);
      
      const groundingLinks: { title: string; uri: string }[] = [];
      const chunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) groundingLinks.push({ title: chunk.web.title, uri: chunk.web.uri });
          if (chunk.maps) groundingLinks.push({ title: chunk.maps.title, uri: chunk.maps.uri });
        });
      }

      const modelMsg: ChatMessage = {
        role: 'model',
        text: (response as any).text || "I couldn't generate a response.",
        timestamp: Date.now(),
        groundingLinks: groundingLinks.length > 0 ? groundingLinks : undefined
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Error: Failed to fetch response from Gemini. Please check your connection or API configuration.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Search className="text-blue-400" size={20} />
            Grounding Chat
          </h2>
          <p className="text-sm text-slate-500">Enhanced reasoning with Search & Maps</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setUseSearch(!useSearch)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${useSearch ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400'}`}
          >
            <Search size={14} /> Search
          </button>
          <button 
             onClick={() => {
               setUseMaps(!useMaps);
               if(!useMaps) setUseSearch(true); // Maps works best with Search
             }}
             className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${useMaps ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}
          >
            <MapIcon size={14} /> Maps
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="p-4 bg-slate-900 rounded-full">
              <Sparkles size={32} className="text-blue-500" />
            </div>
            <p className="text-center max-w-sm">
              Ask anything! Try queries like "What's happening in tech news today?" or "Show me top rated pizza places in Seattle."
            </p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl p-4 md:p-5 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10' 
                : 'bg-slate-900 border border-slate-800 text-slate-200'
            }`}>
              <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</div>
              
              {msg.groundingLinks && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingLinks.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1 rounded-full flex items-center gap-1 transition-colors border border-slate-700"
                      >
                        <LinkIcon size={12} /> {link.title || 'Source'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={`text-[10px] mt-2 opacity-40 font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center space-x-3">
              <Loader2 className="animate-spin text-blue-400" size={18} />
              <span className="text-sm text-slate-400">Gemini is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 pt-0 mt-auto sticky bottom-0 bg-slate-950/80 backdrop-blur-md">
        <div className="relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your prompt here..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-blue-500 transition-all text-slate-100 placeholder-slate-500 shadow-2xl"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
              !input.trim() || isLoading 
                ? 'text-slate-600 bg-slate-800' 
                : 'text-white bg-blue-600 hover:bg-blue-500 active:scale-95'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
