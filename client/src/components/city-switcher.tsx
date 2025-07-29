import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, ChevronDown } from 'lucide-react';

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

interface LocationData {
  detectedCity: SupportedCity;
  ip: string;
  supportedCities: SupportedCity[];
}

export default function CitySwitcher() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(true);

  // Detect user's location on first load
  const { data: locationData, isLoading } = useQuery<LocationData>({
    queryKey: ['location-detect'],
    queryFn: async () => {
      const response = await fetch('/api/location/detect');
      if (!response.ok) {
        throw new Error('Failed to detect location');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get list of all supported cities
  const { data: cities } = useQuery<SupportedCity[]>({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await fetch('/api/cities');
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (locationData) {
      // Check if user has a saved city preference
      const savedCity = localStorage.getItem('tinyamp-selected-city');
      if (savedCity && cities?.find(city => city.id === savedCity)) {
        setSelectedCity(savedCity);
      } else {
        // Use detected city as default
        setSelectedCity(locationData.detectedCity.id);
      }
      setIsDetecting(false);
    }
  }, [locationData, cities]);

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    localStorage.setItem('tinyamp-selected-city', cityId);
    
    // Trigger page refresh to load city-specific content
    window.location.reload();
  };

  if (isLoading || isDetecting || !cities) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="h-4 w-4" />
        <span>Detecting location...</span>
      </div>
    );
  }

  const currentCity = cities.find(city => city.id === selectedCity);

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-gray-600" />
      <Select value={selectedCity} onValueChange={handleCityChange}>
        <SelectTrigger className="w-[180px] border-0 bg-transparent hover:bg-gray-100 transition-colors">
          <SelectValue>
            <span className="font-medium">
              {currentCity ? currentCity.name : 'Select City'}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              <div className="flex flex-col">
                <span className="font-medium">{city.name}</span>
                <span className="text-xs text-gray-500">
                  {city.region}, {city.country}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {locationData && selectedCity === locationData.detectedCity.id && (
        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          Auto-detected
        </span>
      )}
    </div>
  );
}

// City Context Provider for global state management
import { createContext, useContext, ReactNode } from 'react';

interface CityContextType {
  selectedCity: SupportedCity | null;
  setSelectedCity: (city: SupportedCity) => void;
  supportedCities: SupportedCity[];
}

const CityContext = createContext<CityContextType | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<SupportedCity | null>(null);
  
  const { data: cities = [] } = useQuery<SupportedCity[]>({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await fetch('/api/cities');
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      return response.json();
    },
  });

  const setSelectedCity = (city: SupportedCity) => {
    setSelectedCityState(city);
    localStorage.setItem('tinyamp-selected-city', city.id);
  };

  return (
    <CityContext.Provider value={{
      selectedCity,
      setSelectedCity,
      supportedCities: cities
    }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}