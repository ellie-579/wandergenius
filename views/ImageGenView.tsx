
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Download, Image as ImageIcon, Sparkles, AlertCircle, Info } from 'lucide-react';

const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'flash' | 'pro'>('flash');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);

    try {
      // Check for Pro model permissions
      if (modelType === 'pro') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
          // After openSelectKey we proceed as if success as per instructions
        }
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const modelName = modelType === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            ...(modelType === 'pro' ? { imageSize: "1K" } : {})
          }
        }
      });

      const imgPart = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
      if (imgPart?.inlineData) {
        setGeneratedImage(`data:image/png;base64,${imgPart.inlineData.data}`);
      } else {
        throw new Error("No image data received from API");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("API Key Error. Please re-select your key in the AI Studio dialog.");
        // @ts-ignore
        await window.aistudio.openSelectKey();
      } else {
        setError("Generation failed. " + (err.message || "Unknown error occurred."));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            <ImageIcon className="text-purple-400" size={32} />
            Visual Studio
          </h2>
          <p className="text-slate-400">Bring your imagination to life with Gemini</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setModelType('flash')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${modelType === 'flash' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            FLASH
          </button>
          <button 
            onClick={() => setModelType('pro')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${modelType === 'pro' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            PRO (1K)
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A surreal landscape with floating islands, purple trees, and a silver river under a triple sunset, high detail, digital art..."
            className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 min-h-[120px] focus:outline-none focus:border-purple-500 transition-all text-slate-100 placeholder-slate-600 resize-none shadow-xl"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`absolute right-4 bottom-4 px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all ${
              !prompt.trim() || isGenerating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/20 active:scale-95'
            }`}
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isGenerating ? 'Creating...' : 'Generate'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="relative min-h-[400px] flex items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          {isGenerating ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin"></div>
                <ImageIcon size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-200">Generating Masterpiece</p>
                <p className="text-sm text-slate-500">Wait a few seconds for our AI to dream it up...</p>
              </div>
            </div>
          ) : generatedImage ? (
            <div className="relative w-full h-full group">
              <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <a 
                  href={generatedImage} 
                  download={`gemini-${Date.now()}.png`}
                  className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl"
                >
                  <Download size={24} />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 space-y-4">
              <div className="mx-auto w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                <ImageIcon size={40} className="text-slate-700" />
              </div>
              <div>
                <p className="text-slate-400">Your generated image will appear here</p>
                <p className="text-xs text-slate-600 mt-1">PRO model requires a paid API key and billing documentation.</p>
              </div>
            </div>
          )}
        </div>

        {modelType === 'pro' && (
          <div className="bg-blue-900/10 border border-blue-900/30 rounded-2xl p-4 flex items-start gap-3">
            <Info size={18} className="text-blue-400 mt-1 flex-shrink-0" />
            <div className="text-xs text-slate-400 leading-relaxed">
              Gemini 3 Pro Image supports 1K resolution and higher quality details. Ensure you have selected a valid API key from a paid GCP project. 
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-400 hover:underline ml-1">Learn more about billing.</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenView;
