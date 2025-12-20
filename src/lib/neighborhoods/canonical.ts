/**
 * Canonical Neighborhood Reference
 * Provides authoritative list and fuzzy matching for SF neighborhoods
 */

// All 117 SF neighborhoods from GeoJSON
export const NEIGHBORHOODS = [
  "Alamo Square",
  "Anza Vista",
  "Apparel City",
  "Aquatic Park / Ft. Mason",
  "Ashbury Heights",
  "Balboa Terrace",
  "Bayview",
  "Bernal Heights",
  "Bret Harte",
  "Buena Vista",
  "Candlestick Point SRA",
  "Castro",
  "Cathedral Hill",
  "Cayuga",
  "Central Waterfront",
  "Chinatown",
  "Civic Center",
  "Clarendon Heights",
  "Cole Valley",
  "Corona Heights",
  "Cow Hollow",
  "Crocker Amazon",
  "Diamond Heights",
  "Dogpatch",
  "Dolores Heights",
  "Downtown / Union Square",
  "Duboce Triangle",
  "Eureka Valley",
  "Excelsior",
  "Fairmount",
  "Financial District",
  "Fishermans Wharf",
  "Forest Hill",
  "Forest Knolls",
  "Glen Park",
  "Golden Gate Heights",
  "Golden Gate Park",
  "Haight Ashbury",
  "Hayes Valley",
  "Holly Park",
  "Hunters Point",
  "India Basin",
  "Ingleside",
  "Ingleside Terraces",
  "Inner Richmond",
  "Inner Sunset",
  "Japantown",
  "Laguna Honda",
  "Lake Street",
  "Lakeshore",
  "Laurel Heights / Jordan Park",
  "Lincoln Park / Ft. Miley",
  "Little Hollywood",
  "Lone Mountain",
  "Lower Haight",
  "Lower Nob Hill",
  "Lower Pacific Heights",
  "Marina",
  "McLaren Park",
  "Merced Heights",
  "Merced Manor",
  "Midtown Terrace",
  "Mint Hill",
  "Miraloma Park",
  "Mission",
  "Mission Bay",
  "Mission Dolores",
  "Mission Terrace",
  "Monterey Heights",
  "Mt. Davidson Manor",
  "Nob Hill",
  "Noe Valley",
  "North Beach",
  "Northern Waterfront",
  "Oceanview",
  "Outer Mission",
  "Outer Richmond",
  "Outer Sunset",
  "Pacific Heights",
  "Panhandle",
  "Parkmerced",
  "Parkside",
  "Parnassus Heights",
  "Peralta Heights",
  "Polk Gulch",
  "Portola",
  "Potrero Hill",
  "Presidio Heights",
  "Presidio National Park",
  "Presidio Terrace",
  "Produce Market",
  "Rincon Hill",
  "Russian Hill",
  "Seacliff",
  "Sherwood Forest",
  "Showplace Square",
  "Silver Terrace",
  "South Beach",
  "South of Market",
  "St. Francis Wood",
  "St. Marys Park",
  "Stonestown",
  "Sunnydale",
  "Sunnyside",
  "Sutro Heights",
  "Telegraph Hill",
  "Tenderloin",
  "Treasure Island",
  "Union Street",
  "University Mound",
  "Upper Market",
  "Visitacion Valley",
  "West Portal",
  "Western Addition",
  "Westwood Highlands",
  "Westwood Park",
  "Yerba Buena Island",
];

// Common aliases and variations
export const ALIASES: Record<string, string> = {
  // SoMa variations
  "soma": "South of Market",
  "so ma": "South of Market",
  "s.o.m.a": "South of Market",
  "s.o.m.a.": "South of Market",
  
  // FiDi variations
  "fidi": "Financial District",
  "fi di": "Financial District",
  "financial": "Financial District",
  "downtown": "Downtown / Union Square",
  
  // Mission variations
  "mission district": "Mission",
  "the mission": "Mission",
  
  // Marina variations
  "marina district": "Marina",
  "the marina": "Marina",
  
  // Castro variations
  "the castro": "Castro",
  "castro district": "Castro",
  
  // Haight variations
  "haight": "Haight Ashbury",
  "haight-ashbury": "Haight Ashbury",
  "the haight": "Haight Ashbury",
  
  // Nob Hill variations
  "nobhill": "Nob Hill",
  
  // Pacific Heights variations
  "pac heights": "Pacific Heights",
  "pacheights": "Pacific Heights",
  
  // Richmond variations
  "richmond": "Inner Richmond",
  "the richmond": "Inner Richmond",
  
  // Sunset variations
  "sunset": "Inner Sunset",
  "the sunset": "Inner Sunset",
  
  // Potrero variations
  "potrero": "Potrero Hill",
  
  // Russian Hill variations
  "russianhill": "Russian Hill",
  
  // Telegraph variations
  "telegraph": "Telegraph Hill",
  
  // Noe variations
  "noe": "Noe Valley",
  
  // Bernal variations
  "bernal": "Bernal Heights",
  
  // Presidio variations
  "presidio": "Presidio National Park",
  "the presidio": "Presidio National Park",
  
  // Fisherman's Wharf variations
  "fisherman's wharf": "Fishermans Wharf",
  "fishermans": "Fishermans Wharf",
  "fisherman": "Fishermans Wharf",
  
  // Golden Gate Park variations
  "ggp": "Golden Gate Park",
  "golden gate": "Golden Gate Park",
  
  // Union Square variations
  "union square": "Downtown / Union Square",
  
  // Embarcadero variations
  "embarcadero": "South Beach",
  
  // Chinatown variations
  "china town": "Chinatown",
  
  // North Beach variations
  "northbeach": "North Beach",
  "little italy": "North Beach",
};

// Normalize string for matching
function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ')      // Collapse multiple spaces
    .trim();
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Match a query string to a canonical neighborhood name
 * Returns null if no good match is found
 */
export function matchNeighborhood(query: string): string | null {
  const normalized = normalize(query);
  
  // Skip very short queries (likely common words)
  if (normalized.length < 3) {
    return null;
  }
  
  // Check exact match in aliases first
  if (ALIASES[normalized]) {
    return ALIASES[normalized];
  }
  
  // Check if normalized query is contained in any neighborhood name
  for (const neighborhood of NEIGHBORHOODS) {
    const normalizedNeighborhood = normalize(neighborhood);
    if (normalizedNeighborhood === normalized) {
      return neighborhood;
    }
  }
  
  // Check for partial matches (query contained in neighborhood)
  // But only if the query is substantial (at least 4 chars) to avoid false matches
  if (normalized.length >= 4) {
  for (const neighborhood of NEIGHBORHOODS) {
    const normalizedNeighborhood = normalize(neighborhood);
    if (normalizedNeighborhood.includes(normalized) || normalized.includes(normalizedNeighborhood)) {
      return neighborhood;
      }
    }
  }
  
  // Fuzzy match with Levenshtein distance (max distance: 2 for typos)
  // Only for queries with at least 4 characters
  if (normalized.length >= 4) {
  let bestMatch: string | null = null;
  let bestDistance = Infinity;
  
  for (const neighborhood of NEIGHBORHOODS) {
    const normalizedNeighborhood = normalize(neighborhood);
    const distance = levenshteinDistance(normalized, normalizedNeighborhood);
    
    // Only consider if distance is reasonable relative to length
    const maxDistance = Math.min(2, Math.floor(normalized.length / 3));
    
    if (distance < bestDistance && distance <= maxDistance) {
      bestDistance = distance;
      bestMatch = neighborhood;
    }
  }
  
  return bestMatch;
  }
  
  return null;
}

/**
 * Extract and match multiple neighborhoods from a query
 * Returns array of canonical neighborhood names
 */
export function extractNeighborhoods(query: string): string[] {
  const matches = new Set<string>();
  const normalized = normalize(query);
  const words = normalized.split(' ');
  
  // Try whole query first (highest priority for exact matches)
  const wholeMatch = matchNeighborhood(query);
  if (wholeMatch) {
    matches.add(wholeMatch);
    // If we got an exact match for the whole query, return it immediately
    // This prevents partial matches like "Pacific Heights" matching "Lower Pacific Heights"
    return Array.from(matches);
  }
  
  // Try matching 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    const match = matchNeighborhood(phrase);
    if (match) {
      matches.add(match);
    }
  }
  
  // Try matching 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    const match = matchNeighborhood(phrase);
    if (match) {
      matches.add(match);
    }
  }
  
  // Try matching individual words ONLY if they're likely neighborhood names
  // Skip common words that might match but aren't the focus
  const commonWords = new Set(['the', 'about', 'tell', 'me', 'in', 'at', 'on', 'near', 'around', 'best', 'worst', 'good', 'bad', 'safe', 'dangerous', 'crime', 'food', 'restaurant', 'bar', 'park', 'area', 'neighborhood', 'district', 'street', 'avenue', 'heights', 'hill', 'valley', 'beach']);
  
  for (const word of words) {
    // Skip if it's a common word or very short
    if (commonWords.has(word) || word.length < 4) {
      continue;
    }
    
    const match = matchNeighborhood(word);
    if (match) {
      matches.add(match);
    }
  }
  
  return Array.from(matches);
}
