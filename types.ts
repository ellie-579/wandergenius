
export enum AppView {
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  IMAGE_GEN = 'image_gen',
  LIVE = 'live',
  TTS = 'tts',
  VIDEO = 'video'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingLinks?: { title: string; uri: string }[];
}

export interface TripPlan {
  id: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: { min: number; max: number };
  additionalCities: string[];
  timestamp: number;
}

export interface WeatherDay {
  date: string;
  high: number;
  low: number;
  description: string;
  icon: string;
}

export interface FlightOffer {
  price: number;
  airline: string;
  duration: string;
  stops: number;
  departure: string;
  arrival: string;
  originCode?: string;
  destCode?: string;
}

export interface Neighborhood {
  name: string;
  description: string;
  bestFor: string;
  lat: number;
  lng: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  location: string;
}
