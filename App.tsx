import React, { useState, useEffect, useRef } from 'react';
import { 
  Plane, MapPin, Calendar, DollarSign, Plus, 
  CloudSun, Map as MapIcon, Hotel, Sparkles, 
  Share2, Save, X, Loader2, 
  Zap, Star, Bookmark, ExternalLink, Navigation, Compass,
  Landmark, Info, Shuffle,
  ArrowRight, TrainFront, Car, ThermometerSnowflake
} from 'lucide-react';
import { getTravelIntelligence, fetchWeather, geocodeCity } from './services/geminiService';
import { TripPlan, Neighborhood } from './types';

const App: React.FC = () => {
  // Form State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState({ start: '', end: '' });
  const [budget, setBudget] = useState({ min: 100, max: 400 });
  const [additionalCities, setAdditionalCities] = useState<string[]>([]);
  const [newCity, setNewCity] = useState('');

  // App State
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningStep, setPlanningStep] = useState('');
  const [results, setResults] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [savedTrips, setSavedTrips] = useState<TripPlan[]>([]);
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wandergenius_saved');
    if (saved) setSavedTrips(JSON.parse(saved));
  }, []);

  const handleAddCity = () => {
    const trimmed = newCity.trim();
    if (trimmed && !additionalCities.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setAdditionalCities([...additionalCities, trimmed]);
      setNewCity('');
    }
  };

  const removeCity = (city: string) => {
    setAdditionalCities(additionalCities.filter(c => c !== city));
  };

  const executePlan = async (originVal: string, destVal: string, startVal: string, endVal: string, additionalVal: string[], budgetVal: {min: number, max: number}) => {
    setIsPlanning(true);
    setResults(null);
    setWeatherData(null);
    setPlanningStep('Syncing Intelligence...');

    try {
      // Start both core intelligence and geocoding in parallel
      const intelPromise = getTravelIntelligence({ origin: originVal, destination: destVal, startDate: startVal, endDate: endVal, additionalCities: additionalVal, budget: budgetVal });
      const geoPromise = geocodeCity(destVal);

      // We can start weather as soon as geo is ready, don't wait for intel
      const weatherPromise = geoPromise.then(async (geo) => {
        if (!geo) return null;
        
        const startDateObj = new Date(startVal);
        const today = new Date();
        const diffTime = startDateObj.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= -1 && diffDays <= 14) {
          return await fetchWeather(geo.lat, geo.lon);
        }
        return null;
      });

      // Wait for the main intelligence
      const [intel, geo, weather] = await Promise.all([intelPromise, geoPromise, weatherPromise]);
      
      if (!intel) throw new Error("Intelligence Engine Unavailable");

      setResults(intel);
      
      if (weather && weather.daily) {
        setWeatherData({ ...weather, isForecast: true });
      } else {
        setWeatherData({ climatology: intel.climatology, isForecast: false });
      }

      setIsPlanning(false);

      if (geo) {
        setTimeout(() => initMap(intel.neighborhoods, geo), 100);
      }

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
      setIsPlanning(false);
      alert("A synchronization error occurred. Please verify your cities.");
    }
  };

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !dates.start || !dates.end) return;
    await executePlan(origin, destination, dates.start, dates.end, additionalCities, budget);
  };

  const initMap = (neighborhoods: Neighborhood[], center: any) => {
    const L = (window as any).L;
    if (!L || !center) return;
    const mapContainer = document.getElementById('neighborhood-map');
    if (!mapContainer) return;
    if (mapRef.current) mapRef.current.remove();
    try {
      const map = L.map('neighborhood-map', { scrollWheelZoom: false }).setView([center.lat, center.lon], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
      neighborhoods?.forEach(n => {
        if (n.lat && n.lng) L.marker([n.lat, n.lng]).addTo(map).bindPopup(`<b>${n.name}</b><br>${n.bestFor}`);
      });
      mapRef.current = map;
    } catch (err) { console.error(err); }
  };

  const toggleSaveTrip = () => {
    if (!destination) return;
    const isAlreadySaved = savedTrips.some(t => t.destination.toLowerCase() === destination.toLowerCase());
    if (isAlreadySaved) {
      const updated = savedTrips.filter(t => t.destination.toLowerCase() !== destination.toLowerCase());
      setSavedTrips(updated);
      localStorage.setItem('wandergenius_saved', JSON.stringify(updated));
    } else {
      const newSaved: TripPlan = {
        id: Math.random().toString(36).substr(2, 9),
        origin, destination, startDate: dates.start, endDate: dates.end, budget, additionalCities,
        timestamp: Date.now()
      };
      const updated = [newSaved, ...savedTrips];
      setSavedTrips(updated);
      localStorage.setItem('wandergenius_saved', JSON.stringify(updated));
    }
  };

  const openExternalSearch = (platform: 'google' | 'kayak') => {
    const firstFlight = results?.flights?.[0];
    const originCode = firstFlight?.originCode || origin;
    const destCode = firstFlight?.destCode || destination;
    const start = dates.start;
    const end = dates.end;
    if (!start || !end) return;
    let url = platform === 'google' 
      ? `https://www.google.com/travel/flights?q=flights from ${originCode} to ${destCode} on ${start} returning ${end}`
      : `https://www.kayak.com/flights/${originCode}-${destCode}/${start}/${end}?sort=bestflight_a`;
    window.open(url, '_blank');
  };

  const convertTemp = (celsius: number | undefined) => {
    if (celsius === undefined || isNaN(celsius)) return '--';
    if (tempUnit === 'C') return Math.round(celsius);
    return Math.round((celsius * 9) / 5 + 32);
  };

  const getTransportIcon = (mode: string) => {
    const m = mode.toLowerCase();
    if (m.includes('flight') || m.includes('plane')) return <Plane size={14} />;
    if (m.includes('train')) return <TrainFront size={14} />;
    if (m.includes('car') || m.includes('drive')) return <Car size={14} />;
    return <Navigation size={14} />;
  };

  const isTripSaved = savedTrips.some(t => t.destination.toLowerCase() === destination.toLowerCase());

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Compass size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">WanderGenius</h1>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-500">
            <button className="hover:text-blue-600 transition-colors">Flights</button>
            <button className="hover:text-blue-600 transition-colors">Hotels</button>
            <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black transition-all">My Account</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-24">
        
        {/* SEARCH FORM */}
        <section className="mb-24">
          <div className="max-w-5xl mx-auto text-center mb-10">
            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none mb-4">
              Travel <span className="text-blue-600">Planner.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium">Plan your next trip. Find the best flights, stays, and activities within your budget.</p>
          </div>

          <div className="bg-white rounded-[3rem] p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-slate-100">
            <form onSubmit={handlePlanTrip} className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 space-y-3">
                  <div className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Origin</label>
                    <div className="flex items-center gap-3">
                      <Plane size={18} className="text-slate-300" />
                      <input type="text" placeholder="Home City" value={origin} onChange={(e) => setOrigin(e.target.value)} className="bg-transparent w-full font-bold focus:outline-none text-base text-slate-900" />
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Destination</label>
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-blue-600" />
                      <input type="text" placeholder="Goal City" value={destination} onChange={(e) => setDestination(e.target.value)} required className="bg-transparent w-full font-bold focus:outline-none text-base text-slate-900" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 px-6 py-4 bg-blue-50 border-2 border-blue-100 rounded-[2rem] flex flex-col justify-center shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-blue-600" />
                    <label className="text-[10px] font-black uppercase text-blue-900 tracking-[0.2em]">Travel Window</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="absolute -top-2 left-3 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.1em] z-10">Departure</label>
                      <input type="date" value={dates.start} onChange={(e) => setDates({...dates, start: e.target.value})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2 text-sm font-black text-slate-900 focus:border-blue-500 outline-none transition-all shadow-sm" />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-2 left-3 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.1em] z-10">Return</label>
                      <input type="date" value={dates.end} onChange={(e) => setDates({...dates, end: e.target.value})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2 text-sm font-black text-slate-900 focus:border-blue-500 outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 border-dashed">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Navigation size={18} className="text-blue-500" />
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Multi-City stops</label>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Add extra stop..." value={newCity} onChange={(e) => setNewCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCity())} className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-sm outline-none focus:border-blue-500" />
                    <button onClick={(e) => (e.preventDefault(), handleAddCity())} type="button" className="p-4 bg-blue-600 text-white rounded-2xl transition-all shadow-md active:scale-95"><Plus size={24}/></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {additionalCities.map(city => (
                      <span key={city} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                        {city} <X size={14} className="cursor-pointer" onClick={() => removeCity(city)} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} className="text-emerald-500" />
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Max Stay Budget</label>
                  </div>
                  <div className="px-2">
                    <input type="range" min="50" max="1500" step="50" value={budget.max} onChange={(e) => setBudget({...budget, max: parseInt(e.target.value)})} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between items-center mt-6">
                      <div className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl text-base font-black shadow-sm">
                        ${budget.max} <span className="text-[10px] text-slate-400 ml-1">/ NIGHT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isPlanning} className={`w-full py-8 rounded-[2rem] flex items-center justify-center transition-all group overflow-hidden relative ${isPlanning ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl active:scale-[0.98]'}`}>
                {isPlanning ? (
                   <div className="flex items-center gap-4">
                     <Loader2 className="animate-spin" size={32} />
                     <span className="text-xl font-black uppercase tracking-widest">{planningStep}</span>
                   </div>
                ) : (
                  <div className="flex items-center gap-4 font-black text-2xl tracking-tight">
                    <Sparkles size={28} /> GENERATE TRIP INFO
                  </div>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* RESULTS HUB */}
        <div ref={resultsRef} className="space-y-16 scroll-mt-24">
          {results && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                 <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{destination} Intelligence</h2>
                    <p className="text-slate-500 font-medium">{dates.start} — {dates.end}</p>
                 </div>
                 <button onClick={toggleSaveTrip} className={`flex items-center gap-4 px-8 py-4 rounded-2xl font-black text-xs transition-all ${isTripSaved ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'}`}>
                    {isTripSaved ? <Bookmark fill="currentColor" size={20} /> : <Save size={20} />}
                    {isTripSaved ? 'SAVED TO TRIPS' : 'SAVE TRIP INFO'}
                 </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                  {weatherData && (
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
                       <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                              {weatherData.isForecast ? <CloudSun size={24} /> : <ThermometerSnowflake size={24} />}
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Weather Hub</h3>
                              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                                {weatherData.isForecast ? 'Live 14-Day Forecast' : 'Historical Climatology'}
                              </span>
                            </div>
                          </div>
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                             <button onClick={() => setTempUnit('C')} className={`px-3 py-1.5 rounded-lg text-xs font-black ${tempUnit === 'C' ? 'bg-white text-blue-600' : 'text-slate-400'}`}>°C</button>
                             <button onClick={() => setTempUnit('F')} className={`px-3 py-1.5 rounded-lg text-xs font-black ${tempUnit === 'F' ? 'bg-white text-blue-600' : 'text-slate-400'}`}>°F</button>
                          </div>
                       </div>
                       
                       {weatherData.isForecast ? (
                         <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">
                           {weatherData.daily?.time.map((t: string, i: number) => (
                             <div key={i} className="flex flex-col items-center bg-slate-50/50 px-6 py-4 rounded-[2rem] min-w-[110px] border border-slate-100">
                               <span className="text-[10px] font-black text-slate-400 mb-2 uppercase">{new Date(t).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
                               <div className="text-blue-600 mb-2"><CloudSun size={24} /></div>
                               <span className="text-lg font-black text-slate-900">{convertTemp(weatherData.daily.temperature_2m_max[i])}°{tempUnit}</span>
                               <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{convertTemp(weatherData.daily.temperature_2m_min[i])}° Low</span>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex flex-col items-center justify-center">
                              <span className="text-[10px] font-black text-blue-400 uppercase mb-2 tracking-widest">Avg High</span>
                              <span className="text-4xl font-black text-blue-900">{convertTemp(weatherData.climatology?.avgHigh)}°{tempUnit}</span>
                            </div>
                            <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex flex-col items-center justify-center">
                              <span className="text-[10px] font-black text-blue-400 uppercase mb-2 tracking-widest">Avg Low</span>
                              <span className="text-4xl font-black text-blue-900">{convertTemp(weatherData.climatology?.avgLow)}°{tempUnit}</span>
                            </div>
                            <div className="bg-blue-600 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center text-white">
                              <p className="text-sm font-bold italic leading-tight">"{weatherData.climatology?.generalAdvice}"</p>
                              <span className="text-[8px] font-black uppercase tracking-tighter mt-4 opacity-70">Source: Historical Weather Patterns</span>
                            </div>
                         </div>
                       )}
                    </div>
                  )}

                  <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-2xl h-[550px] relative group">
                     <div id="neighborhood-map" className="w-full h-full"></div>
                     <div className="absolute top-6 right-6 bottom-6 w-80 bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl z-[10] border border-slate-100 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><MapIcon size={20} /></div>
                           <h3 className="text-xl font-black text-slate-900 tracking-tight">Neighborhoods</h3>
                        </div>
                        <div className="space-y-6">
                           {results.neighborhoods?.map((n: any, i: number) => (
                             <div key={i} className="pl-4 border-l-2 border-slate-100 hover:border-blue-500 transition-all py-1">
                                <h4 className="text-sm font-black text-slate-900 mb-0.5">{n.name}</h4>
                                <p className="text-[11px] text-slate-500 mb-2 italic line-clamp-2">"{n.description}"</p>
                                <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">Best for {n.bestFor}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </div>

                {/* RIGHT: FLIGHTS & HOTELS */}
                <div className="lg:col-span-4 space-y-12">
                  <div className="bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl p-8 border-b-8 border-b-blue-600">
                    <h3 className="text-white font-black text-xl flex items-center gap-3 mb-8"><Plane size={24} className="text-blue-500" /> Airfare Hub</h3>
                    <div className="space-y-4 mb-10 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                      {results.flights?.map((flight: any, i: number) => (
                        <div key={i} className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 hover:border-blue-500/40 transition-all">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-blue-400 font-black text-[10px] uppercase truncate max-w-[120px]">{flight.airline}</span>
                            <span className="text-white font-black text-xl">${flight.price}</span>
                          </div>
                          <div className="flex items-center justify-between mb-3 text-white text-xs font-bold">
                             <span>{flight.originCode}</span>
                             <div className="flex-1 border-t border-dashed border-white/20 mx-3 relative">
                                <Plane size={10} className="text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                             </div>
                             <span>{flight.destCode}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/5 pt-3">
                             <span className="text-[9px] font-black uppercase text-slate-300">{flight.stops === 0 ? 'Direct' : `${flight.stops} Stop(s)`}</span>
                             <span className="text-[9px] font-bold text-slate-500">{flight.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => openExternalSearch('google')} className="py-3.5 bg-white text-slate-900 rounded-xl text-[9px] font-black shadow-lg transition-transform active:scale-95">✈️ Google Flights</button>
                       <button onClick={() => openExternalSearch('kayak')} className="py-3.5 bg-[#334155] text-white rounded-xl text-[9px] font-black shadow-lg transition-transform active:scale-95">🚢 Kayak</button>
                    </div>
                  </div>

                  <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-2xl p-10">
                    <h3 className="text-3xl font-black text-slate-900 flex items-center gap-5 mb-10"><Hotel size={32} className="text-blue-600" /> Stays</h3>
                    <div className="space-y-8">
                      {results.accommodations?.map((hotel: any, i: number) => {
                        const checkIn = dates.start;
                        const checkOut = dates.end;
                        const bookingUrl = hotel.mapUrl?.includes('google.com') 
                          ? `${hotel.mapUrl}&checkin=${checkIn}&checkout=${checkOut}`
                          : `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + destination + ' hotel booking')}&checkin=${checkIn}&checkout=${checkOut}`;

                        // Use a stylized caricature/drawing seed-based avatar as a reliable placeholder
                        const drawingUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(hotel.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

                        return (
                          <div key={i} className="flex flex-col gap-4 group">
                            <div className="flex gap-6 items-center">
                              <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden shrink-0 bg-blue-50/50 shadow-inner flex items-center justify-center p-1 border border-blue-100">
                                <img 
                                  src={drawingUrl} 
                                  alt={hotel.name} 
                                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-black text-slate-900 text-sm truncate">{hotel.name}</h5>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-slate-900 font-black text-lg">${hotel.price}<span className="text-slate-400 font-medium text-[9px]">/nt</span></span>
                                  <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-black">
                                    {hotel.rating} <Star size={10} fill="currentColor" />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 italic leading-tight">"{hotel.description}"</p>
                              </div>
                            </div>
                            <a 
                              href={bookingUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            >
                              Verify Availability <ExternalLink size={12} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {results.routeStrategy && (additionalCities.length > 0) && (
                <section className="mt-20 py-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden px-10">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Shuffle size={20} /></div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Route Optimizer</h3>
                   </div>
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-8">
                         <div className="flex flex-wrap items-center gap-y-6">
                            {results.routeStrategy.stops?.map((stop: string, idx: number) => (
                               <React.Fragment key={idx}>
                                  <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase flex items-center gap-3 shadow-md">
                                     <MapPin size={14} className="text-blue-400" /> {stop}
                                  </div>
                                  {idx < (results.routeStrategy.stops.length - 1) && <ArrowRight size={18} className="text-slate-300 mx-2" />}
                               </React.Fragment>
                            ))}
                         </div>
                         <p className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-600 italic leading-relaxed">"{results.routeStrategy.logic}"</p>
                      </div>
                      <div className="lg:col-span-4 space-y-3">
                         {results.routeStrategy.segments?.map((seg: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-slate-100 transition-all">
                               <div className="flex items-center gap-4">
                                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">{getTransportIcon(seg.mode)}</div>
                                  <div className="flex flex-col">
                                     <span className="text-[10px] font-black text-slate-900 leading-none mb-1">{seg.from} → {seg.to}</span>
                                     <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">{seg.mode}</span>
                                  </div>
                               </div>
                               <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">{seg.durationSuggestion}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </section>
              )}

              <section className="mt-24 pt-24 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Landmark size={24} /></div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Top Attractions</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                   {results.attractions?.map((attr: any, i: number) => (
                      <div key={i} className="group bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                         <div className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[7px] font-black uppercase mb-3">{attr.category}</div>
                         <h4 className="text-sm font-black text-slate-900 mb-2 leading-tight truncate">{attr.name}</h4>
                         <p className="text-[10px] text-slate-500 leading-relaxed mb-4 line-clamp-3 italic">"{attr.description}"</p>
                         <div className="pt-3 border-t border-slate-50 flex items-center gap-1.5 truncate">
                            <Info size={10} className="text-blue-500 shrink-0" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{attr.whyItIsFamous}</span>
                         </div>
                      </div>
                   ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl"><Compass size={28} /></div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">WanderGenius</h1>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">© 2025 Intelligence Engine. Web Grounded Ecosystem.</p>
          <div className="flex gap-8 text-slate-400">
            <button className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"><Bookmark size={24} /></button>
            <button className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"><Share2 size={24} /></button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;