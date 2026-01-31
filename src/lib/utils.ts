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
