interface LocationData {
  city: string;
  region: string;
  country: string;
  timezone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface SupportedCity {
  id: string;
  name: string;
  region: string;
  country: string;
  timezone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  aliases: string[];
  musicSceneDescription: string;
}

// Comprehensive list of supported cities for independent music discovery
export const SUPPORTED_CITIES: SupportedCity[] = [
  {
    id: 'san-francisco',
    name: 'San Francisco',
    region: 'California',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    aliases: ['sf', 'san francisco', 'san francisco bay area', 'bay area'],
    musicSceneDescription: 'Home to legendary independent venues and a thriving indie music scene'
  },
  {
    id: 'brooklyn',
    name: 'Brooklyn',
    region: 'New York',
    country: 'USA',
    timezone: 'America/New_York',
    coordinates: { lat: 40.6782, lng: -73.9442 },
    aliases: ['brooklyn', 'new york', 'nyc', 'new york city'],
    musicSceneDescription: 'Epicenter of indie rock, experimental music, and emerging artists'
  },
  {
    id: 'portland',
    name: 'Portland',
    region: 'Oregon',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    coordinates: { lat: 45.5152, lng: -122.6784 },
    aliases: ['portland', 'pdx'],
    musicSceneDescription: 'Vibrant indie and alternative music community with unique venues'
  },
  {
    id: 'austin',
    name: 'Austin',
    region: 'Texas',
    country: 'USA',
    timezone: 'America/Chicago',
    coordinates: { lat: 30.2672, lng: -97.7431 },
    aliases: ['austin', 'atx'],
    musicSceneDescription: 'Live music capital with countless indie venues and festivals'
  },
  {
    id: 'seattle',
    name: 'Seattle',
    region: 'Washington',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    aliases: ['seattle'],
    musicSceneDescription: 'Birthplace of grunge and home to influential independent music venues'
  },
  {
    id: 'chicago',
    name: 'Chicago',
    region: 'Illinois',
    country: 'USA',
    timezone: 'America/Chicago',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    aliases: ['chicago'],
    musicSceneDescription: 'Rich indie rock and electronic music scene with historic venues'
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    region: 'California',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    aliases: ['los angeles', 'la', 'hollywood'],
    musicSceneDescription: 'Diverse independent music scene spanning multiple neighborhoods'
  },
  {
    id: 'denver',
    name: 'Denver',
    region: 'Colorado',
    country: 'USA',
    timezone: 'America/Denver',
    coordinates: { lat: 39.7392, lng: -104.9903 },
    aliases: ['denver'],
    musicSceneDescription: 'Growing indie music scene with intimate venues and outdoor concerts'
  },
  {
    id: 'toronto',
    name: 'Toronto',
    region: 'Ontario',
    country: 'Canada',
    timezone: 'America/Toronto',
    coordinates: { lat: 43.6532, lng: -79.3832 },
    aliases: ['toronto'],
    musicSceneDescription: 'Thriving indie music scene with diverse venues and festivals'
  },
  {
    id: 'montreal',
    name: 'Montreal',
    region: 'Quebec',
    country: 'Canada',
    timezone: 'America/Montreal',
    coordinates: { lat: 45.5017, lng: -73.5673 },
    aliases: ['montreal', 'montréal'],
    musicSceneDescription: 'Unique francophone indie music culture with innovative venues'
  },
  {
    id: 'london',
    name: 'London',
    region: 'England',
    country: 'UK',
    timezone: 'Europe/London',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    aliases: ['london'],
    musicSceneDescription: 'Historic and contemporary indie music scene with iconic venues'
  },
  {
    id: 'berlin',
    name: 'Berlin',
    region: 'Berlin',
    country: 'Germany',
    timezone: 'Europe/Berlin',
    coordinates: { lat: 52.5200, lng: 13.4050 },
    aliases: ['berlin'],
    musicSceneDescription: 'Underground electronic and indie music capital with legendary venues'
  }
];

class LocationService {
  async detectLocationFromIP(ip: string): Promise<LocationData | null> {
    try {
      // Use ipapi.co for IP geolocation (free tier available)
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      
      if (!response.ok) {
        console.log('IP geolocation service unavailable');
        return null;
      }

      const data = await response.json();
      
      return {
        city: data.city || '',
        region: data.region || '',
        country: data.country_name || '',
        timezone: data.timezone || '',
        coordinates: {
          lat: data.latitude || 0,
          lng: data.longitude || 0
        }
      };
    } catch (error) {
      console.error('Location detection error:', error);
      return null;
    }
  }

  findSupportedCity(location: LocationData): SupportedCity | null {
    const searchTerms = [
      location.city.toLowerCase(),
      `${location.city} ${location.region}`.toLowerCase(),
      location.region.toLowerCase()
    ];

    for (const city of SUPPORTED_CITIES) {
      for (const searchTerm of searchTerms) {
        if (city.aliases.some(alias => 
          alias.toLowerCase().includes(searchTerm) || 
          searchTerm.includes(alias.toLowerCase())
        )) {
          return city;
        }
      }
    }

    return null;
  }

  getDefaultCity(): SupportedCity {
    // Default to San Francisco as the primary city
    return SUPPORTED_CITIES[0];
  }

  getSupportedCities(): SupportedCity[] {
    return SUPPORTED_CITIES;
  }

  getCityById(cityId: string): SupportedCity | null {
    return SUPPORTED_CITIES.find(city => city.id === cityId) || null;
  }

  async determineUserCity(ip?: string): Promise<SupportedCity> {
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      // Local development or no IP - return default city
      return this.getDefaultCity();
    }

    const location = await this.detectLocationFromIP(ip);
    if (!location) {
      return this.getDefaultCity();
    }

    const supportedCity = this.findSupportedCity(location);
    return supportedCity || this.getDefaultCity();
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  findNearestCity(lat: number, lng: number): SupportedCity {
    let nearestCity = SUPPORTED_CITIES[0];
    let shortestDistance = this.calculateDistance(
      lat, lng, 
      nearestCity.coordinates.lat, 
      nearestCity.coordinates.lng
    );

    for (const city of SUPPORTED_CITIES.slice(1)) {
      const distance = this.calculateDistance(
        lat, lng,
        city.coordinates.lat,
        city.coordinates.lng
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCity = city;
      }
    }

    return nearestCity;
  }
}

export const locationService = new LocationService();