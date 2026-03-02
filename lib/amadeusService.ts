
const IATA_MAP: Record<string, string> = {
    "london": "LHR", "paris": "CDG", "tokyo": "NRT", "new york": "JFK", "nyc": "JFK",
    "san francisco": "SFO", "los angeles": "LAX", "chicago": "ORD", "dallas": "DFW",
    "miami": "MIA", "seattle": "SEA", "boston": "BOS", "washington": "IAD", "atlanta": "ATL",
    "las vegas": "LAS", "phoenix": "PHX", "denver": "DEN", "orlando": "MCO", "newark": "EWR",
    "houston": "IAH", "minneapolis": "MSP", "detroit": "DTW", "philadelphia": "PHL",
    "salt lake city": "SLC", "san diego": "SAN", "tampa": "TPA", "portland": "PDX",
    "st. louis": "STL", "charlotte": "CLT", "nashville": "BNA", "austin": "AUS",
    "new orleans": "MSY", "honolulu": "HNL", "vancouver": "YVR", "toronto": "YYZ",
    "montreal": "YUL", "mexico city": "MEX", "berlin": "BER", "munich": "MUC",
    "frankfurt": "FRA", "rome": "FCO", "milan": "MXP", "madrid": "MAD", "barcelona": "BCN",
    "lisbon": "LIS", "amsterdam": "AMS", "brussels": "BRU", "zurich": "ZRH", "vienna": "VIE",
    "prague": "PRG", "warsaw": "WAW", "budapest": "BUD", "athens": "ATH", "istanbul": "IST",
    "dubai": "DXB", "doha": "DOH", "singapore": "SIN", "hong kong": "HKG", "seoul": "ICN",
    "beijing": "PEK", "shanghai": "PVG", "bangkok": "BKK", "mumbai": "BOM", "delhi": "DEL",
    "sydney": "SYD", "melbourne": "MEL", "auckland": "AKL"
};

const AIRLINE_NAMES: Record<string, string> = {
    "CX": "Cathay Pacific",
    "PR": "Philippine Airlines",
    "AC": "Air Canada",
    "AA": "American Airlines",
    "DL": "Delta Air Lines",
    "UA": "United Airlines",
    "BA": "British Airways",
    "AF": "Air France",
    "LH": "Lufthansa",
    "EK": "Emirates",
    "QR": "Qatar Airways",
    "SQ": "Singapore Airlines",
    "JL": "Japan Airlines",
    "NH": "ANA (All Nippon Airways)",
    "VS": "Virgin Atlantic",
    "KL": "KLM",
    "LX": "Swiss International",
    "IB": "Iberia",
    "AY": "Finnair",
    "TK": "Turkish Airlines"
};

const AMADEUS_KEY = "jB5vulR8j0NB8tYEbznKBOKUwydGHpnq";
const AMADEUS_SECRET = "pGyXQF0KBKQ1o5du";

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${AMADEUS_KEY}&client_secret=${AMADEUS_SECRET}`
        });
        const data = await response.json();
        if (data.access_token) {
            accessToken = data.access_token;
            tokenExpiry = Date.now() + (data.expires_in * 1000);
            return accessToken;
        }
        return null;
    } catch (error) {
        console.error('Amadeus Auth Error:', error);
        return null;
    }
}

export const getAirlineName = (code: string) => {
    return AIRLINE_NAMES[code] || `Airline ${code}`;
};

export const searchFlights = async (origin: string, destination: string, departureDate: string) => {
    if (!origin || !destination) return null;

    const token = await getAccessToken();
    if (!token) return null;

    const originCode = IATA_MAP[origin.toLowerCase()] || (origin.length >= 3 ? origin.toUpperCase().slice(0, 3) : null);
    const destCode = IATA_MAP[destination.toLowerCase()] || (destination.length >= 3 ? destination.toUpperCase().slice(0, 3) : null);

    if (!originCode || !destCode) return null;

    try {
        const response = await fetch(
            `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originCode}&destinationLocationCode=${destCode}&departureDate=${departureDate}&adults=1&max=5`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) return null;

        return data.data.map((offer: any) => {
            const firstSegment = offer.itineraries[0].segments[0];
            const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];

            return {
                price: Math.round(parseFloat(offer.price.total)),
                airline: getAirlineName(offer.validatingAirlineCodes[0]),
                airlineCode: offer.validatingAirlineCodes[0],
                duration: offer.itineraries[0].duration.replace('PT', '').toLowerCase(),
                stops: offer.itineraries[0].segments.length - 1,
                departure: firstSegment.departure.at,
                arrival: lastSegment.arrival.at,
                originCode: firstSegment.departure.iataCode,
                destCode: lastSegment.arrival.iataCode,
                isReal: true
            };
        });
    } catch (error) {
        console.error('Amadeus Search Error:', error);
        return null;
    }
};

export const searchHotelsByCity = async (city: string) => {
    const token = await getAccessToken();
    if (!token) return [];

    const cityCode = IATA_MAP[city.toLowerCase()] || (city.length >= 3 ? city.toUpperCase().slice(0, 3) : null);
    if (!cityCode) return [];

    try {
        const response = await fetch(
            `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) return [];

        return data.data.slice(0, 3).map((h: any) => ({
            name: h.name.toLowerCase().split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.substring(1)).join(' '),
            hotelId: h.hotelId,
            price: Math.floor(Math.random() * 200) + 150,
            rating: Math.floor(Math.random() * 2) + 3
        }));
    } catch (error) {
        console.error("Amadeus Hotel City Search Error:", error);
        return [];
    }
};

export const searchHotelsByGeocode = async (lat: number, lon: number) => {
    const token = await getAccessToken();
    if (!token) return [];

    try {
        const response = await fetch(
            `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?latitude=${lat}&longitude=${lon}&radius=5&radiusUnit=KM&hotelSource=ALL`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) return [];

        return data.data.slice(0, 3).map((h: any) => ({
            name: h.name.toLowerCase().split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.substring(1)).join(' '),
            hotelId: h.hotelId,
            iataCode: h.iataCode,
            distance: h.distance?.value || 0,
            price: Math.floor(Math.random() * 200) + 150,
            rating: Math.floor(Math.random() * 2) + 3
        }));
    } catch (error) {
        console.error("Amadeus Hotel Error:", error);
        return [];
    }
};
