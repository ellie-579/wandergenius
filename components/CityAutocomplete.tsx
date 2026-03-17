'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── World-city list ──────────────────────────────────────────────────────────
// Format: "City, Country" — large enough for solid coverage, small enough for
// instant client-side filtering.
const CITIES: string[] = [
    // North America
    'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Houston, USA',
    'Phoenix, USA', 'Philadelphia, USA', 'San Antonio, USA', 'San Diego, USA',
    'Dallas, USA', 'San Jose, USA', 'Austin, USA', 'Jacksonville, USA',
    'Fort Worth, USA', 'Columbus, USA', 'Charlotte, USA', 'San Francisco, USA',
    'Indianapolis, USA', 'Seattle, USA', 'Denver, USA', 'Boston, USA',
    'Nashville, USA', 'Baltimore, USA', 'Oklahoma City, USA', 'Louisville, USA',
    'Portland, USA', 'Las Vegas, USA', 'Milwaukee, USA', 'Albuquerque, USA',
    'Tucson, USA', 'Fresno, USA', 'Sacramento, USA', 'Mesa, USA',
    'Kansas City, USA', 'Atlanta, USA', 'Omaha, USA', 'Colorado Springs, USA',
    'Raleigh, USA', 'Long Beach, USA', 'Virginia Beach, USA', 'Minneapolis, USA',
    'Tampa, USA', 'New Orleans, USA', 'Arlington, USA', 'Wichita, USA',
    'Miami, USA', 'Orlando, USA', 'Pittsburgh, USA', 'Cincinnati, USA',
    'Detroit, USA', 'Salt Lake City, USA', 'Honolulu, USA', 'Anchorage, USA',
    'Toronto, Canada', 'Montreal, Canada', 'Vancouver, Canada', 'Calgary, Canada',
    'Edmonton, Canada', 'Ottawa, Canada', 'Winnipeg, Canada', 'Quebec City, Canada',
    'Hamilton, Canada', 'Halifax, Canada',
    'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico',
    'Cancún, Mexico', 'Tijuana, Mexico', 'Puebla, Mexico',

    // South America
    'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil',
    'Salvador, Brazil', 'Fortaleza, Brazil', 'Belo Horizonte, Brazil',
    'Manaus, Brazil', 'Curitiba, Brazil', 'Recife, Brazil', 'Porto Alegre, Brazil',
    'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Rosario, Argentina',
    'Mendoza, Argentina', 'La Plata, Argentina',
    'Bogotá, Colombia', 'Medellín, Colombia', 'Cali, Colombia', 'Barranquilla, Colombia',
    'Lima, Peru', 'Arequipa, Peru', 'Trujillo, Peru',
    'Santiago, Chile', 'Valparaíso, Chile', 'Concepción, Chile',
    'Caracas, Venezuela', 'Maracaibo, Venezuela',
    'Montevideo, Uruguay', 'Asunción, Paraguay', 'La Paz, Bolivia', 'Quito, Ecuador',
    'Guayaquil, Ecuador', 'Georgetown, Guyana', 'Paramaribo, Suriname',

    // Europe
    'London, UK', 'Birmingham, UK', 'Manchester, UK', 'Glasgow, UK',
    'Leeds, UK', 'Sheffield, UK', 'Edinburgh, UK', 'Bristol, UK', 'Liverpool, UK',
    'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France',
    'Nice, France', 'Nantes, France', 'Bordeaux, France', 'Strasbourg, France',
    'Berlin, Germany', 'Hamburg, Germany', 'Munich, Germany', 'Cologne, Germany',
    'Frankfurt, Germany', 'Stuttgart, Germany', 'Düsseldorf, Germany', 'Leipzig, Germany',
    'Dortmund, Germany', 'Essen, Germany', 'Bremen, Germany', 'Dresden, Germany',
    'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain',
    'Zaragoza, Spain', 'Málaga, Spain', 'Bilbao, Spain', 'Alicante, Spain',
    'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy',
    'Palermo, Italy', 'Genoa, Italy', 'Bologna, Italy', 'Florence, Italy', 'Venice, Italy',
    'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands',
    'Utrecht, Netherlands', 'Eindhoven, Netherlands',
    'Brussels, Belgium', 'Antwerp, Belgium', 'Ghent, Belgium',
    'Vienna, Austria', 'Graz, Austria', 'Linz, Austria', 'Salzburg, Austria',
    'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland', 'Bern, Switzerland',
    'Lisbon, Portugal', 'Porto, Portugal', 'Braga, Portugal',
    'Stockholm, Sweden', 'Gothenburg, Sweden', 'Malmö, Sweden',
    'Oslo, Norway', 'Bergen, Norway', 'Trondheim, Norway',
    'Copenhagen, Denmark', 'Aarhus, Denmark',
    'Helsinki, Finland', 'Tampere, Finland', 'Turku, Finland',
    'Warsaw, Poland', 'Kraków, Poland', 'Łódź, Poland', 'Wrocław, Poland',
    'Poznań, Poland', 'Gdańsk, Poland',
    'Prague, Czech Republic', 'Brno, Czech Republic',
    'Budapest, Hungary', 'Bratislava, Slovakia',
    'Bucharest, Romania', 'Cluj-Napoca, Romania', 'Timișoara, Romania',
    'Sofia, Bulgaria', 'Plovdiv, Bulgaria',
    'Athens, Greece', 'Thessaloniki, Greece',
    'Belgrade, Serbia', 'Zagreb, Croatia', 'Ljubljana, Slovenia',
    'Sarajevo, Bosnia and Herzegovina', 'Podgorica, Montenegro', 'Tirana, Albania',
    'Skopje, North Macedonia', 'Pristina, Kosovo',
    'Kyiv, Ukraine', 'Kharkiv, Ukraine', 'Odessa, Ukraine', 'Dnipro, Ukraine',
    'Lviv, Ukraine', 'Minsk, Belarus', 'Chișinău, Moldova',
    'Vilnius, Lithuania', 'Riga, Latvia', 'Tallinn, Estonia',
    'Reykjavik, Iceland', 'Dublin, Ireland', 'Cork, Ireland',
    'Valletta, Malta', 'Nicosia, Cyprus', 'Luxembourg City, Luxembourg',
    'Monaco, Monaco', 'Vaduz, Liechtenstein', 'Andorra la Vella, Andorra',
    'San Marino, San Marino',

    // Russia / CIS
    'Moscow, Russia', 'Saint Petersburg, Russia', 'Novosibirsk, Russia',
    'Yekaterinburg, Russia', 'Kazan, Russia', 'Nizhny Novgorod, Russia',
    'Chelyabinsk, Russia', 'Samara, Russia', 'Ufa, Russia', 'Rostov-on-Don, Russia',
    'Tbilisi, Georgia', 'Yerevan, Armenia', 'Baku, Azerbaijan',
    'Almaty, Kazakhstan', 'Nur-Sultan, Kazakhstan',
    'Tashkent, Uzbekistan', 'Samarkand, Uzbekistan',
    'Bishkek, Kyrgyzstan', 'Dushanbe, Tajikistan', 'Ashgabat, Turkmenistan',

    // Middle East
    'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE',
    'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia', 'Mecca, Saudi Arabia',
    'Medina, Saudi Arabia', 'Dammam, Saudi Arabia',
    'Kuwait City, Kuwait', 'Doha, Qatar', 'Manama, Bahrain',
    'Muscat, Oman', 'Salalah, Oman',
    'Baghdad, Iraq', 'Basra, Iraq', 'Erbil, Iraq',
    'Tehran, Iran', 'Isfahan, Iran', 'Mashhad, Iran', 'Shiraz, Iran', 'Tabriz, Iran',
    'Tel Aviv, Israel', 'Jerusalem, Israel', 'Haifa, Israel',
    'Amman, Jordan', 'Aqaba, Jordan',
    'Beirut, Lebanon', 'Damascus, Syria', 'Aleppo, Syria',
    'Sanaa, Yemen', 'Aden, Yemen',
    'Ankara, Turkey', 'Istanbul, Turkey', 'Izmir, Turkey', 'Bursa, Turkey',
    'Adana, Turkey', 'Antalya, Turkey', 'Gaziantep, Turkey', 'Konya, Turkey',

    // Africa
    'Cairo, Egypt', 'Alexandria, Egypt', 'Giza, Egypt', 'Luxor, Egypt', 'Aswan, Egypt',
    'Lagos, Nigeria', 'Abuja, Nigeria', 'Kano, Nigeria', 'Ibadan, Nigeria',
    'Johannesburg, South Africa', 'Cape Town, South Africa', 'Durban, South Africa',
    'Pretoria, South Africa', 'Port Elizabeth, South Africa',
    'Nairobi, Kenya', 'Mombasa, Kenya', 'Kisumu, Kenya',
    'Addis Ababa, Ethiopia', 'Dire Dawa, Ethiopia',
    'Accra, Ghana', 'Kumasi, Ghana',
    'Dar es Salaam, Tanzania', 'Dodoma, Tanzania', 'Zanzibar City, Tanzania',
    'Kampala, Uganda', 'Entebbe, Uganda',
    'Kigali, Rwanda', 'Bujumbura, Burundi',
    'Lusaka, Zambia', 'Harare, Zimbabwe', 'Bulawayo, Zimbabwe',
    'Maputo, Mozambique', 'Antananarivo, Madagascar',
    'Dakar, Senegal', 'Abidjan, Ivory Coast', 'Bamako, Mali',
    'Ouagadougou, Burkina Faso', 'Conakry, Guinea', 'Freetown, Sierra Leone',
    'Monrovia, Liberia', 'Accra, Ghana', 'Lomé, Togo', 'Cotonou, Benin',
    'Niamey, Niger', 'N\'Djamena, Chad', 'Bangui, Central African Republic',
    'Kinshasa, DR Congo', 'Brazzaville, Congo', 'Libreville, Gabon',
    'Yaoundé, Cameroon', 'Douala, Cameroon',
    'Luanda, Angola', 'Windhoek, Namibia', 'Gaborone, Botswana',
    'Maseru, Lesotho', 'Mbabane, Eswatini',
    'Tripoli, Libya', 'Tunis, Tunisia', 'Algiers, Algeria', 'Casablanca, Morocco',
    'Rabat, Morocco', 'Marrakech, Morocco', 'Fez, Morocco', 'Tangier, Morocco',
    'Khartoum, Sudan', 'Omdurman, Sudan', 'Juba, South Sudan',
    'Mogadishu, Somalia', 'Djibouti City, Djibouti', 'Asmara, Eritrea',

    // South & Southeast Asia
    'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Hyderabad, India',
    'Ahmedabad, India', 'Chennai, India', 'Kolkata, India', 'Surat, India',
    'Pune, India', 'Jaipur, India', 'Lucknow, India', 'Kanpur, India',
    'Nagpur, India', 'Indore, India', 'Thane, India', 'Bhopal, India',
    'Visakhapatnam, India', 'Pimpri-Chinchwad, India', 'Patna, India', 'Vadodara, India',
    'Goa, India', 'Agra, India', 'Varanasi, India', 'Amritsar, India',
    'Colombo, Sri Lanka', 'Kandy, Sri Lanka',
    'Kathmandu, Nepal', 'Pokhara, Nepal',
    'Dhaka, Bangladesh', 'Chittagong, Bangladesh',
    'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan',
    'Faisalabad, Pakistan', 'Rawalpindi, Pakistan', 'Peshawar, Pakistan',
    'Kabul, Afghanistan', 'Mazar-i-Sharif, Afghanistan',
    'Male, Maldives', 'Thimphu, Bhutan',
    'Rangoon, Myanmar', 'Mandalay, Myanmar',
    'Bangkok, Thailand', 'Chiang Mai, Thailand', 'Phuket, Thailand', 'Pattaya, Thailand',
    'Kuala Lumpur, Malaysia', 'Penang, Malaysia', 'Johor Bahru, Malaysia',
    'Singapore, Singapore',
    'Jakarta, Indonesia', 'Surabaya, Indonesia', 'Bandung, Indonesia',
    'Medan, Indonesia', 'Semarang, Indonesia', 'Bali, Indonesia',
    'Manila, Philippines', 'Quezon City, Philippines', 'Davao, Philippines',
    'Cebu City, Philippines',
    'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam', 'Da Nang, Vietnam',
    'Phnom Penh, Cambodia', 'Siem Reap, Cambodia',
    'Vientiane, Laos', 'Luang Prabang, Laos',
    'Naypyidaw, Myanmar',
    'Bandar Seri Begawan, Brunei',
    'Dili, Timor-Leste', 'Port Moresby, Papua New Guinea',

    // East Asia
    'Tokyo, Japan', 'Yokohama, Japan', 'Osaka, Japan', 'Nagoya, Japan',
    'Sapporo, Japan', 'Fukuoka, Japan', 'Kobe, Japan', 'Kyoto, Japan',
    'Kawasaki, Japan', 'Saitama, Japan', 'Hiroshima, Japan', 'Sendai, Japan',
    'Beijing, China', 'Shanghai, China', 'Guangzhou, China', 'Shenzhen, China',
    'Chengdu, China', 'Wuhan, China', 'Xi\'an, China', 'Hangzhou, China',
    'Chongqing, China', 'Nanjing, China', 'Tianjin, China', 'Dongguan, China',
    'Shenyang, China', 'Harbin, China', 'Qingdao, China', 'Zhengzhou, China',
    'Dalian, China', 'Kunming, China', 'Jinan, China', 'Changsha, China',
    'Nanchang, China', 'Xiamen, China', 'Guiyang, China', 'Taiyuan, China',
    'Hong Kong, China', 'Macau, China',
    'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea',
    'Daegu, South Korea', 'Daejeon, South Korea', 'Gwangju, South Korea',
    'Pyongyang, North Korea', 'Taipei, Taiwan', 'Taichung, Taiwan', 'Kaohsiung, Taiwan',
    'Ulaanbaatar, Mongolia',

    // Oceania
    'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia',
    'Perth, Australia', 'Adelaide, Australia', 'Gold Coast, Australia',
    'Newcastle, Australia', 'Canberra, Australia', 'Hobart, Australia', 'Darwin, Australia',
    'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand',
    'Suva, Fiji', 'Port Vila, Vanuatu', 'Honiara, Solomon Islands',
    'Nuku\'alofa, Tonga', 'Apia, Samoa', 'Funafuti, Tuvalu',
];

// ─── IATA codes + common nicknames → canonical city name ─────────────────────
// When the user types an alias the input is transparently resolved to the
// matching entry in CITIES so the autocomplete list always surfaces the right
// suggestion.
const ALIASES: Record<string, string> = {
    // USA
    sfo: 'San Francisco, USA', sf: 'San Francisco, USA', 'san fran': 'San Francisco, USA',
    lax: 'Los Angeles, USA', la: 'Los Angeles, USA',
    jfk: 'New York, USA', lga: 'New York, USA', ewr: 'New York, USA',
    nyc: 'New York, USA', ny: 'New York, USA', 'new york city': 'New York, USA',
    ord: 'Chicago, USA', chi: 'Chicago, USA',
    mia: 'Miami, USA',
    sea: 'Seattle, USA',
    bos: 'Boston, USA',
    den: 'Denver, USA',
    atl: 'Atlanta, USA',
    las: 'Las Vegas, USA', 'vegas': 'Las Vegas, USA',
    dfw: 'Dallas, USA', dal: 'Dallas, USA',
    iah: 'Houston, USA', hou: 'Houston, USA',
    phx: 'Phoenix, USA',
    pdx: 'Portland, USA',
    mco: 'Orlando, USA',
    tpa: 'Tampa, USA',
    msp: 'Minneapolis, USA',
    slc: 'Salt Lake City, USA',
    hnl: 'Honolulu, USA',
    dtw: 'Detroit, USA',
    bwi: 'Baltimore, USA',
    pit: 'Pittsburgh, USA',
    cvg: 'Cincinnati, USA',
    mke: 'Milwaukee, USA',
    cmh: 'Columbus, USA',
    sat: 'San Antonio, USA',
    san: 'San Diego, USA', sd: 'San Diego, USA',
    sjc: 'San Jose, USA', sj: 'San Jose, USA',
    aus: 'Austin, USA',
    rdu: 'Raleigh, USA',
    clt: 'Charlotte, USA',
    ind: 'Indianapolis, USA',
    msy: 'New Orleans, USA', nola: 'New Orleans, USA',
    okc: 'Oklahoma City, USA',
    sac: 'Sacramento, USA',
    // Canada
    yyz: 'Toronto, Canada', tor: 'Toronto, Canada',
    yul: 'Montreal, Canada', mtl: 'Montreal, Canada',
    yvr: 'Vancouver, Canada', van: 'Vancouver, Canada',
    yyc: 'Calgary, Canada',
    yow: 'Ottawa, Canada',
    // Mexico
    mex: 'Mexico City, Mexico', cdmx: 'Mexico City, Mexico',
    cun: 'Cancún, Mexico',
    // UK / Europe
    lhr: 'London, UK', lon: 'London, UK',
    lcy: 'London, UK', lgw: 'London, UK', stn: 'London, UK',
    cdg: 'Paris, France', par: 'Paris, France',
    fra: 'Frankfurt, Germany',
    muc: 'Munich, Germany',
    txl: 'Berlin, Germany', ber: 'Berlin, Germany',
    ams: 'Amsterdam, Netherlands',
    mad: 'Madrid, Spain',
    bcn: 'Barcelona, Spain',
    fcо: 'Rome, Italy', rom: 'Rome, Italy',
    mxp: 'Milan, Italy', lin: 'Milan, Italy',
    zrh: 'Zurich, Switzerland',
    vie: 'Vienna, Austria',
    bru: 'Brussels, Belgium',
    lis: 'Lisbon, Portugal',
    cph: 'Copenhagen, Denmark',
    arn: 'Stockholm, Sweden',
    osl: 'Oslo, Norway',
    hel: 'Helsinki, Finland',
    waw: 'Warsaw, Poland',
    prg: 'Prague, Czech Republic',
    bud: 'Budapest, Hungary',
    ath: 'Athens, Greece',
    ist: 'Istanbul, Turkey',
    dub: 'Dublin, Ireland',
    // Middle East / Africa
    dxb: 'Dubai, UAE',
    auh: 'Abu Dhabi, UAE',
    doh: 'Doha, Qatar',
    ruh: 'Riyadh, Saudi Arabia',
    cai: 'Cairo, Egypt',
    jnb: 'Johannesburg, South Africa', jhb: 'Johannesburg, South Africa',
    cpt: 'Cape Town, South Africa',
    nbo: 'Nairobi, Kenya',
    los: 'Lagos, Nigeria',
    lfw: 'Accra, Ghana',
    // Asia / Pacific
    nrt: 'Tokyo, Japan', hnd: 'Tokyo, Japan', tyo: 'Tokyo, Japan',
    kix: 'Osaka, Japan', osa: 'Osaka, Japan',
    pek: 'Beijing, China', bjs: 'Beijing, China',
    pvg: 'Shanghai, China', sha: 'Shanghai, China',
    hkg: 'Hong Kong, China',
    sin: 'Singapore, Singapore',
    bkk: 'Bangkok, Thailand',
    kul: 'Kuala Lumpur, Malaysia',
    cgk: 'Jakarta, Indonesia',
    mnl: 'Manila, Philippines',
    hcm: 'Ho Chi Minh City, Vietnam', sgn: 'Ho Chi Minh City, Vietnam',
    han: 'Hanoi, Vietnam',
    bom: 'Mumbai, India', mum: 'Mumbai, India', bombay: 'Mumbai, India',
    del: 'Delhi, India', ndl: 'Delhi, India',
    blr: 'Bangalore, India',
    maa: 'Chennai, India', madras: 'Chennai, India',
    ccu: 'Kolkata, India', calcutta: 'Kolkata, India',
    icn: 'Seoul, South Korea', sel: 'Seoul, South Korea',
    tpe: 'Taipei, Taiwan',
    syd: 'Sydney, Australia',
    mel: 'Melbourne, Australia',
    bne: 'Brisbane, Australia',
    per: 'Perth, Australia',
    akl: 'Auckland, New Zealand',
};

// ─── Component ────────────────────────────────────────────────────────────────
interface CityAutocompleteProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    inputClassName?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    id?: string;
}

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'City or airport code',
    required = false,
    className = '',
    inputClassName = '',
    onKeyDown,
    id,
}) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter suggestions whenever value changes
    const updateSuggestions = useCallback((q: string) => {
        if (!q || q.length < 1) {
            setSuggestions([]);
            setOpen(false);
            return;
        }
        const lower = q.toLowerCase().trim();

        // 1. Exact alias match → show that city first
        const aliasMatch = ALIASES[lower];

        // 2. Partial alias matches (e.g. "sf" matches "sfo", "sf", "san fran")
        const partialAliasMatches = Object.entries(ALIASES)
            .filter(([key]) => key.startsWith(lower) && key !== lower)
            .map(([, city]) => city);

        // 3. City name prefix matches
        const prefixMatches = CITIES.filter(c => c.toLowerCase().startsWith(lower));

        // 4. City name substring matches
        const substringMatches = CITIES.filter(
            c => !c.toLowerCase().startsWith(lower) && c.toLowerCase().includes(lower)
        );

        // Combine: alias > partial aliases > prefix > substring, deduplicated
        const seen = new Set<string>();
        const ordered: string[] = [];
        for (const city of [
            ...(aliasMatch ? [aliasMatch] : []),
            ...partialAliasMatches,
            ...prefixMatches,
            ...substringMatches,
        ]) {
            if (!seen.has(city)) { seen.add(city); ordered.push(city); }
        }

        const results = ordered.slice(0, 8);
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(-1);
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        updateSuggestions(e.target.value);
    };

    const selectSuggestion = (city: string) => {
        onChange(city);
        setSuggestions([]);
        setOpen(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (open && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, -1));
                return;
            }
            if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                selectSuggestion(suggestions[activeIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setOpen(false);
                return;
            }
        }
        onKeyDown?.(e);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <input
                id={id}
                type="text"
                autoComplete="off"
                placeholder={placeholder}
                value={value}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={() => value && updateSuggestions(value)}
                required={required}
                className={inputClassName}
            />
            {open && suggestions.length > 0 && (
                <ul
                    role="listbox"
                    className="absolute z-[200] left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
                    style={{ minWidth: '220px' }}
                >
                    {suggestions.map((city, idx) => {
                        const [cityName, country] = city.split(', ');
                        const isActive = idx === activeIndex;
                        return (
                            <li
                                key={city}
                                role="option"
                                aria-selected={isActive}
                                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(city); }}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span className="font-bold truncate">{cityName}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-3 shrink-0">
                                    {country}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default CityAutocomplete;
