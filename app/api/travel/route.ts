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
        return null;
    }
}

async function callGemini(apiKey: string, prompt: string) {
    // gemini-2.5-flash with thinking disabled = full quality at flash-lite speed
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 2048,
                thinkingConfig: { thinkingBudget: 0 }
            }
        })
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function POST(req: NextRequest) {
    const trip = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const { origin, destination, startDate, endDate, budget, additionalCities } = trip;
    const context = `Trip: ${origin || 'nearby'} → ${destination}, ${startDate} to ${endDate}, budget $${budget?.max}/night.`;

    // Run two parallel Gemini calls for speed
    const [coreText, extrasText] = await Promise.all([
        // Call 1: Flights + Accommodations (most important)
        callGemini(apiKey, `${context}
Return ONLY valid JSON (no markdown):
{
  "flights": [{"price": number, "airline": string, "duration": string, "stops": number, "originCode": string, "destCode": string}],
  "accommodations": [{"name": string, "price": number, "rating": number, "description": string}],
  "climatology": {"avgHigh": number, "avgLow": number, "generalAdvice": string},
  "feasibility": string
}
Include exactly 3 flights and 3 accommodations. Use realistic typical values.`),

        // Call 2: Neighborhoods + Attractions + Route
        callGemini(apiKey, `${context}
Return ONLY valid JSON (no markdown):
{
  "neighborhoods": [{"name": string, "description": string, "bestFor": string, "lat": number, "lng": number}],
  "attractions": [{"name": string, "description": string, "category": string, "whyItIsFamous": string}],
  "routeStrategy": {"stops": string[], "segments": [{"from": string, "to": string, "mode": string, "durationSuggestion": string}], "logic": string}
}
Include exactly 4 neighborhoods and 5 attractions.${additionalCities?.length > 0 ? ` Multi-city stops: ${additionalCities.join(', ')}.` : ''}`)
    ]);

    const core = extractJSON(coreText);
    const extras = extractJSON(extrasText);

    if (!core && !extras) {
        return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }

    // Merge both results
    const result = {
        ...(core || {}),
        ...(extras || {}),
        accommodations: (core?.accommodations || []).map((hotel: any) => ({
            ...hotel,
            mapUrl: `https://www.google.com/maps/search/${encodeURIComponent(hotel.name + ' ' + destination)}`
        }))
    };

    return NextResponse.json(result);
}
