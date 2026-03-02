<div align="center">
<img width="1200" height="475" alt="WanderGenius Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# WanderGenius ✈️
### AI-Powered Travel Planner

Plan your next trip in seconds. WanderGenius uses Google Gemini AI to generate real flight options, hotel recommendations, neighborhoods, attractions, weather info, and an interactive map — all from a single search.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ellie-579/wandergenius)

</div>

---

## ✨ Features

- 🤖 **AI Trip Planning** — Gemini generates flights, hotels, neighborhoods & attractions tailored to your budget
- 🗺️ **Interactive Map** — Leaflet-powered map showing your destination's key spots
- 🌤️ **Weather Forecast** — Real-time weather data via Open-Meteo API
- ✈️ **Multi-City Stops** — Add layover cities to your itinerary
- 💰 **Budget Filter** — Set a max nightly hotel budget with a slider
- 📱 **Responsive Design** — Works on desktop and mobile

## 🚀 Getting Started

**Prerequisites:** Node.js 18+

1. **Clone the repo**
   ```bash
   git clone https://github.com/ellie-579/wandergenius.git
   cd wandergenius
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your Gemini API key**

   Create a `.env.local` file in the project root:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
   Get a free key at [aistudio.google.com](https://aistudio.google.com) → Get API Key

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | Google Gemini 2.5 Flash |
| Map | Leaflet / OpenStreetMap |
| Weather | Open-Meteo API |
| Deployment | Vercel |

## 📁 Project Structure

```
app/
  layout.tsx          # Root layout
  page.tsx            # Home page
  globals.css         # Global styles
  api/travel/
    route.ts          # Server-side Gemini API route
components/
  App.tsx             # Main app UI
lib/
  types.ts            # TypeScript types
  geminiService.ts    # Gemini client functions
  amadeusService.ts   # Flight/hotel data service
```

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (required) |

## 📦 Deploy to Vercel

1. Push your code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add `GEMINI_API_KEY` in **Settings → Environment Variables**
4. Deploy!

---

<div align="center">
Built with ❤️ using <a href="https://ai.google.dev">Google Gemini AI</a> and <a href="https://nextjs.org">Next.js</a>
</div>
