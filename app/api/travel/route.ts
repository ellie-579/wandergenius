import { NextRequest, NextResponse } from "next/server";

function extractJSON(text: string) {
    try {
        const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        if (match) return JSON.parse(match[1]);
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) return JSON.parse(text.substring(start, end + 1));
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON from Gemini response:", e);
        return null;
    }
}

export async function POST(req: NextRequest) {
    const trip = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[travel route] GEMINI_API_KEY present:', !!apiKey, '| length:', apiKey?.length ?? 0);

    if (!apiKey) {
        console.error('[travel route] No API key found in environment');
        return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const model = 'gemini-2.5-flash';

    const prompt = `Act as a world-class travel intelligence engine. 
  Plan a trip from ${trip.origin || 'nearby'} to ${trip.destination} for ${trip.startDate} to ${trip.endDate}. 
  Budget: $${trip.budget.max}/night.
  
  Return ONLY a single valid JSON block (no markdown, no explanation):
  {
    "flights": [{"price": number, "airline": string, "duration": string, "stops": number, "originCode": string, "destCode": string}],
    "neighborhoods": [{"name": string, "description": string, "bestFor": string, "lat": number, "lng": number}],
    "attractions": [{"name": string, "description": string, "category": string, "whyItIsFamous": string}],
    "accommodations": [{"name": string, "price": number, "rating": number, "description": string}],
    "climatology": {"avgHigh": number, "avgLow": number, "generalAdvice": string},
    "feasibility": string,
    "routeStrategy": {"stops": string[], "segments": [{"from": string, "to": string, "mode": string, "durationSuggestion": string}], "logic": string}
  }
  
  Include exactly 3 flights, 4 neighborhoods, 5 attractions, 3 accommodations. Use realistic data.`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                }
            })
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error('[travel route] Gemini HTTP error:', geminiRes.status, errText);
            return NextResponse.json({ error: "Gemini request failed", detail: errText }, { status: 500 });
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('[travel route] Got response, text length:', rawText.length);

        const data = extractJSON(rawText);
        if (!data) {
            console.error('[travel route] Failed to parse JSON from:', rawText.slice(0, 200));
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        // Add fallback map URLs for accommodations
        if (data.accommodations) {
            data.accommodations = data.accommodations.map((hotel: any) => ({
                ...hotel,
                mapUrl: `https://www.google.com/maps/search/${encodeURIComponent(hotel.name + ' ' + trip.destination)}`
            }));
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Travel route error:", err);
        return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }
}
