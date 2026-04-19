interface NominatimResult {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
    street?: string;
    house_number?: string;
    postcode?: string;
    state?: string;
    county?: string;
    country?: string;
    country_code?: string;
  };
  type: string;
  class: string;
}

interface SearchResult {
  placeId: string;
  lat: number;
  lon: number;
  displayName: string;
  address: string;
  type: string;
  category: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'ZeroHungerSync/1.0 (contact: info@zerohunger.org)';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

const formatAddress = (result: NominatimResult): string => {
  const parts: string[] = [];
  
  if (result.address?.road || result.address?.street) {
    parts.push(result.address.road || result.address.street);
  }
  if (result.address?.house_number) {
    parts.push(result.address.house_number);
  }
  if (result.address?.neighbourhood || result.address?.suburb) {
    parts.push(result.address.neighbourhood || result.address.suburb);
  }
  if (result.address?.city || result.address?.town || result.address?.village || result.address?.municipality) {
    parts.push(result.address.city || result.address.town || result.address.village || result.address.municipality);
  }
  if (result.address?.postcode) {
    parts.push(result.address.postcode);
  }
  if (result.address?.state) {
    parts.push(result.address.state);
  }
  if (result.address?.country) {
    parts.push(result.address.country);
  }
  
  return parts.join(', ');
};

const parseNominatimResult = (result: NominatimResult): SearchResult => {
  const city = result.address?.city || result.address?.town || result.address?.village || result.address?.municipality;
  
  return {
    placeId: result.place_id,
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    displayName: result.display_name,
    address: formatAddress(result),
    type: result.type,
    category: result.class,
    city,
    state: result.address?.state,
    country: result.address?.country,
    postcode: result.address?.postcode
  };
};

export const searchLocations = async (query: string, limit = 5): Promise<SearchResult[]> => {
  if (!query || query.length < 3) {
    return [];
  }

  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: limit.toString(),
    countrycodes: 'pk',
    'accept-language': 'en'
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return [];
    }

    const data: NominatimResult[] = await response.json();
    
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(parseNominatimResult);
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<SearchResult | null> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '16'
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data: NominatimResult = await response.json();
    
    if (!data || !data.place_id) {
      return null;
    }

    return parseNominatimResult(data);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

export const isValidPakistanLocation = (lat: number, lon: number): boolean => {
  const PAKISTAN_BOUNDS = {
    minLat: 23.0,
    maxLat: 37.0,
    minLng: 60.0,
    maxLng: 78.0
  };
  
  return (
    lat >= PAKISTAN_BOUNDS.minLat &&
    lat <= PAKISTAN_BOUNDS.maxLat &&
    lon >= PAKISTAN_BOUNDS.minLng &&
    lon <= PAKISTAN_BOUNDS.maxLng
  );
};

export type { SearchResult, NominatimResult };