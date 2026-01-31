import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

// Type declarations for Google Maps
interface GoogleMapsPlace {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: {
    lat(): number;
    lng(): number;
  };
  geometry?: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
  place_id?: string;
  name?: string;
}

interface GoogleMapsAutocomplete {
  addListener(event: string, handler: () => void): void;
  getPlace(): GoogleMapsPlace;
}

interface GoogleMapsAutocompleteOptions {
  types?: string[];
  componentRestrictions?: {
    country: string | string[];
  };
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: {
            new (inputElement: HTMLInputElement, options?: GoogleMapsAutocompleteOptions): GoogleMapsAutocomplete;
          };
        };
      };
    };
    googleMapsApiKey?: string;
  }
}
interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  value?: Location;
  onChange: (location: Location | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Search for a location",
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<GoogleMapsAutocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
      return;
    }

    if (hasAttemptedLoad) return;

    const loadGoogleMaps = async () => {
      try {
        setIsLoading(true);
        setHasAttemptedLoad(true);

        // Check if Google Maps is already loaded
        if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.Autocomplete) {
          setIsLoaded(true);
          setIsLoading(false);
          return;
        }

        // Check if Google Maps script is already being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
        if (existingScript) {
          // Wait for the existing script to load
          let existingRetryCount = 0;
          const maxExistingRetries = 10;
          const checkExistingAvailability = () => {
            if (window.google?.maps?.places?.Autocomplete) {
              setIsLoaded(true);
              setIsLoading(false);
            } else if (existingRetryCount < maxExistingRetries) {
              existingRetryCount++;
              console.warn(`Existing Google Maps script loaded but Autocomplete not available, retrying... (${existingRetryCount}/${maxExistingRetries})`);
              // Retry after a short delay
              setTimeout(checkExistingAvailability, 100);
            } else {
              console.error('Existing Google Maps script loaded but Autocomplete not available after maximum retries');
              setIsLoading(false);
            }
          };
          existingScript.addEventListener('load', checkExistingAvailability);
          existingScript.addEventListener('error', () => {
            console.error('Error loading existing Google Maps script');
            setIsLoading(false);
          });
          return;
        }

        // Set the API key globally
        window.googleMapsApiKey = apiKey;

        // Load the Google Maps script manually
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=3.63&loading=async`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          // Double-check that Autocomplete is available
          // Sometimes the script loads but libraries take a moment to initialize
          let retryCount = 0;
          const maxRetries = 10;
          const checkAvailability = () => {
            if (window.google?.maps?.places?.Autocomplete) {
              setIsLoaded(true);
              setIsLoading(false);
            } else if (retryCount < maxRetries) {
              retryCount++;
              console.warn(`Google Maps loaded but Autocomplete not available, retrying... (${retryCount}/${maxRetries})`);
              // Retry after a short delay
              setTimeout(checkAvailability, 100);
            } else {
              console.error('Google Maps loaded but Autocomplete not available after maximum retries');
              setIsLoading(false);
            }
          };
          checkAvailability();
        };

        script.onerror = (error) => {
          console.error('Error loading Google Maps script:', error);
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places?.Autocomplete) return;

    // Use the traditional Autocomplete API
    const placeAutocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      // Remove types restriction to allow all types of places (addresses, businesses, etc.)
      componentRestrictions: { country: 'in' }, // Restrict to India only
    });

    placeAutocomplete.addListener('place_changed', () => {
      const place = placeAutocomplete.getPlace();

      if (place && place.geometry && place.geometry.location) {
        const location: Location = {
          id: place.place_id || `custom_${Date.now()}`,
          name: place.name || place.formattedAddress || '',
          address: place.formattedAddress || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };
        onChange(location);
      }
    });

    setAutocomplete(placeAutocomplete);

    return () => {
      // Cleanup handled automatically by React
    };
  }, [isLoaded, onChange]);

  useEffect(() => {
    if (inputRef.current && value && !isLoading) {
      inputRef.current.value = value.name;
    }
  }, [value, isLoading]);

  if (isLoading) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <input
          ref={inputRef}
          placeholder="Loading Google Maps..."
          disabled
          className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <input
          ref={inputRef}
          placeholder="Google Maps not loaded"
          disabled
          className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <input
        ref={inputRef}
        placeholder={placeholder}
        disabled={disabled}
        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onChange={(e) => {
          // If user types manually and clears, clear the value
          if (!e.target.value) {
            onChange(null);
          }
        }}
      />
    </div>
  );
};

export default LocationPicker;