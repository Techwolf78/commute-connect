// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profilePhoto?: string;
  role: 'passenger' | 'driver';
  homeLocation?: Location;
  officeLocation?: Location;
  isProfileComplete?: boolean;
  createdAt: Date;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Driver Types
export interface Driver {
  userId: string;
  vehicleId: string;
  isVerified: boolean;
  rating: number;
  totalRides: number;
  joinedAsDriverAt: Date;
}

export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  seats: number;
}

// Ride Types
export type RideStatus = 'AVAILABLE' | 'BOOKED' | 'DRIVER_REACHED_PICKUP' | 'PASSENGER_ARRIVED' | 'TRIP_STARTED' | 'DESTINATION_REACHED' | 'COMPLETED' | 'EXPIRED';
export type RideDirection = 'to_office' | 'from_office';

export interface Ride {
  id: string;
  driverId: string;
  vehicleId: string;
  startLocation: Location;
  endLocation: Location;
  direction: RideDirection;
  departureTime: Date;
  availableSeats: number;
  totalSeats: number;
  costPerSeat: number;
  status: RideStatus;
  route?: string;
  // Ride execution tracking
  pickupReachedAt?: Date;
  passengerArrivedAt?: Date;
  tripStartedAt?: Date;
  estimatedArrivalTime?: Date; // Static ETA calculated once
  destinationReachedAt?: Date;
  paymentCollected?: boolean;
  rideCompletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  amountToPayDriver: number; // Amount passenger needs to pay driver directly
  status: BookingStatus;
  bookedAt: Date;
  cancelledAt?: Date;
  completedAt?: Date;
}

// Rating Types
export interface Rating {
  id: string;
  bookingId: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Session Types
export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
}

// OTP Types
export interface OTPVerification {
  phone: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
}
