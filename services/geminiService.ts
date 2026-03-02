import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Helper to extract JSON from a string that might contain markdown blocks
function extractJSON(text: string) {
  try {
    const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response:", e);
    return null;
  }
}

export function decodeBase64Audio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encodeUint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const generateText = async (prompt: string, model: string, tools: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: tools.length > 0 ? tools : undefined,
    }
  });
};

export const getTravelIntelligence = async (trip: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  const prompt = `Act as a world-class travel intelligence engine. 
  Plan a trip from ${trip.origin || 'nearby'} to ${trip.destination} for ${trip.startDate} to ${trip.endDate}. 
  Budget: $${trip.budget.max}/night.
  
  MANDATORY REQUIREMENTS:
  1. USE TOOLS: You MUST use Google Search to find currently available prices and real locations.
  2. FLIGHTS: Return EXACTLY 6 distinct, real flight options from various airlines covering different price points and stop counts.
  3. ACCOMMODATIONS: Find 5 REAL hotels at different price points within the budget. For each, provide a specific 'imageSearchTerm' (e.g., "The Ritz-Carlton Paris exterior architecture").
  4. ACCURACY: All data must be grounded in real-world facts for these specific dates.
  
  Response must be a single JSON block:
  {
    "flights": [{"price": number, "airline": string, "duration": string, "stops": number, "originCode": string, "destCode": string}],
    "neighborhoods": [{"name": string, "description": string, "bestFor": string, "lat": number, "lng": number}],
    "attractions": [{"name": string, "description": string, "category": string, "whyItIsFamous": string}],
    "accommodations": [{"name": string, "price": number, "rating": number, "description": string, "imageSearchTerm": string}],
    "climatology": {"avgHigh": number, "avgLow": number, "generalAdvice": string},
    "feasibility": string,
    "routeStrategy": {"stops": string[], "segments": [{"from": string, "to": string, "mode": string, "durationSuggestion": string}], "logic": string}
  }`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });

  const rawText = response.text || '';
  const data = extractJSON(rawText);
  if (!data) return null;

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks && data.accommodations) {
    data.accommodations = data.accommodations.map((hotel: any) => {
      const chunk = groundingChunks.find((c: any) =>
        (c.web?.title?.toLowerCase().includes(hotel.name.toLowerCase()))
      );
      return {
        ...hotel,
        mapUrl: chunk?.web?.uri || `https://www.google.com/maps/search/${encodeURIComponent(hotel.name + ' ' + trip.destination)}`
      };
    });
  }

  return data;
};

export const fetchWeather = async (lat: number, lon: number) => {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

export const geocodeCity = async (city: string) => {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const data = await res.json();
    if (data.results?.[0]) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    }
    return null;
  } catch (err) {
    return null;
  }
};