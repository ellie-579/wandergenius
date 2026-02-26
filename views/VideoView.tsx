
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Play, Loader2, Sparkles, AlertCircle, Info, Clapperboard } from 'lucide-react';

const VideoView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Initiating Veo Engine...');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setVideoUrl(null);
    setError(null);
    setLoadingMsg('Connecting to Video Generation Service...');

    try {
      // Veo requires API key selection
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      setLoadingMsg('Analyzing prompt and storyboard...');
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      let elapsed = 0;
      while (!operation.done) {
        setLoadingMsg(`Generating frames... (${elapsed}s)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        elapsed += 5;
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          headers: { 'x-goog-api-key': process.env.API_KEY || '' }
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Clapperboard className="text-blue-600" /> Video Generator
      </h2>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your video..."
          className="flex-1 p-2 border rounded"
        />
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Generate
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {isGenerating && <div className="text-blue-600">{loadingMsg}</div>}
      {videoUrl && <video src={videoUrl} controls className="w-full rounded shadow" />}
    </div>
  );
};

export default VideoView;