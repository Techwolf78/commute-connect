import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to handle timestamp conversion
export const getDateFromTimestamp = (timestamp: Date | string | { toDate: () => Date }): Date => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return timestamp as Date;
};

// Check if a ride should be expired (departure time < current time)
export const isRideExpired = (departureTime: Date | string | { toDate: () => Date }): boolean => {
  const departureDate = getDateFromTimestamp(departureTime);
  return new Date() > departureDate;
};

// Get ride status with expiration check
export const getRideStatusWithExpiry = (ride: { status: string; departureTime: Date | string | { toDate: () => Date } }): string => {
  if (ride.status === 'AVAILABLE' && isRideExpired(ride.departureTime)) {
    return 'EXPIRED';
  }
  return ride.status;
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLng = (destination.lng - origin.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Format duration in seconds to human readable string
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
export const calculateETA = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  departureTime?: Date
): Promise<{ duration: number; durationText: string; arrivalTime: Date; isFromGoogleMaps: boolean } | null> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('Google Maps API key not found for ETA calculation');
    return null;
  }

  // Check if Google Maps is loaded
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!window.google || !window.google.maps || !(window.google.maps as any).DirectionsService) {
    console.warn('Google Maps Directions API not available');
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const directionsService = new (window.google.maps as any).DirectionsService();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      origin: new (window.google.maps as any).LatLng(origin.lat, origin.lng),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      destination: new (window.google.maps as any).LatLng(destination.lat, destination.lng),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      travelMode: (window.google.maps as any).TravelMode.DRIVING,
      ...(departureTime && {
        drivingOptions: {
          departureTime: departureTime,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trafficModel: (window.google.maps as any).TrafficModel.BEST_GUESS
        }
      })
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await new Promise<any>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      directionsService.route(request, (result: any, status: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (status === (window.google.maps as any).DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });

    if (response.routes && response.routes[0] && response.routes[0].legs && response.routes[0].legs[0]) {
      const leg = response.routes[0].legs[0];
      const duration = leg.duration?.value || 0; // Duration in seconds
      const durationText = leg.duration?.text || '';
      const arrivalTime = new Date((departureTime || new Date()).getTime() + duration * 1000);

      return {
        duration,
        durationText,
        arrivalTime,
        isFromGoogleMaps: true
      };
    }

    return null;
  } catch (error) {
    console.error('Error calculating ETA with Google Maps:', error);
    console.warn('Falling back to estimated ETA calculation');

    // Calculate distance using Haversine formula for better estimation
    const distance = calculateDistance(origin, destination);
    // Assume average speed of 30 km/h in city traffic
    const estimatedDurationHours = distance / 30;
    const estimatedDuration = Math.max(estimatedDurationHours * 60 * 60 * 1000, 15 * 60 * 1000); // Minimum 15 minutes

    const arrivalTime = new Date((departureTime || new Date()).getTime() + estimatedDuration);
    const durationText = formatDuration(estimatedDuration / 1000);

    return {
      duration: estimatedDuration / 1000, // Convert to seconds
      durationText: `${durationText} (estimated)`,
      arrivalTime,
      isFromGoogleMaps: false
    };
  }
};

// Auto-complete rides based on ETA
export const shouldAutoCompleteRide = (
  departureTime: Date | string | { toDate: () => Date },
  estimatedArrivalTime?: Date | string
): boolean => {
  if (!estimatedArrivalTime) return false;

  const departureDate = getDateFromTimestamp(departureTime);
  const currentTime = new Date();

  // If current time is past the estimated arrival time, auto-complete the ride
  try {
    let arrivalTime: Date;

    if (estimatedArrivalTime instanceof Date) {
      // If it's already a Date, use it directly
      arrivalTime = estimatedArrivalTime;
    } else if (typeof estimatedArrivalTime === 'string') {
      // Parse string format
      arrivalTime = new Date(departureDate);

      // Handle fallback format: "1 hour (estimated)" - add 1 hour to departure
      if (estimatedArrivalTime.includes('estimated') || estimatedArrivalTime.includes('hour')) {
        arrivalTime = new Date(departureDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      } else {
        // Parse time format like "8:00 PM"
        const timeMatch = estimatedArrivalTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const ampm = timeMatch[3].toUpperCase();

          if (ampm === 'PM' && hours !== 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;

          arrivalTime.setHours(hours, minutes, 0, 0);
        } else {
          // If we can't parse it, assume 1 hour from departure
          arrivalTime = new Date(departureDate.getTime() + 60 * 60 * 1000);
        }
      }
    } else {
      // Fallback
      arrivalTime = new Date(departureDate.getTime() + 60 * 60 * 1000);
    }

    return currentTime >= arrivalTime;
  } catch (error) {
    console.error('Error parsing estimated arrival time:', error);
    // Fallback: auto-complete after 1 hour from departure
    const oneHourAfterDeparture = new Date(departureDate.getTime() + 60 * 60 * 1000);
    return currentTime >= oneHourAfterDeparture;
  }
};
