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

// Check if a ride should be expired (departure time + 1 hour < current time)
export const isRideExpired = (departureTime: Date | string | { toDate: () => Date }): boolean => {
  const departureDate = getDateFromTimestamp(departureTime);
  const expiryTime = new Date(departureDate.getTime() + 60 * 60 * 1000); // Add 1 hour
  return new Date() > expiryTime;
};

// Get ride status with expiration check
export const getRideStatusWithExpiry = (ride: { status: string; departureTime: Date | string | { toDate: () => Date } }): string => {
  if (ride.status === 'AVAILABLE' && isRideExpired(ride.departureTime)) {
    return 'EXPIRED';
  }
  return ride.status;
};

// Calculate ETA using Google Maps Directions API
export const calculateETA = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  departureTime?: Date
): Promise<{ duration: number; durationText: string; arrivalTime: Date } | null> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('Google Maps API key not found for ETA calculation');
    return null;
  }

  try {
    const directionsService = new google.maps.DirectionsService();

    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode: google.maps.TravelMode.DRIVING,
      ...(departureTime && {
        drivingOptions: {
          departureTime: departureTime,
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      })
    };

    const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
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
        arrivalTime
      };
    }

    return null;
  } catch (error) {
    console.error('Error calculating ETA:', error);
    return null;
  }
};

// Auto-complete rides based on ETA
export const shouldAutoCompleteRide = (
  departureTime: Date | string | { toDate: () => Date },
  estimatedArrivalTime?: string
): boolean => {
  if (!estimatedArrivalTime) return false;

  const departureDate = getDateFromTimestamp(departureTime);
  const currentTime = new Date();

  // If current time is past the estimated arrival time, auto-complete the ride
  try {
    // Parse estimated arrival time (assuming format like "8:00 PM")
    const arrivalTime = new Date(departureDate);
    const timeMatch = estimatedArrivalTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toUpperCase();

      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      arrivalTime.setHours(hours, minutes, 0, 0);

      return currentTime >= arrivalTime;
    }
  } catch (error) {
    console.error('Error parsing estimated arrival time:', error);
  }

  return false;
};
