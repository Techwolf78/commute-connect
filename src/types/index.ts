// User Types
export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  profilePhoto?: string;
  isProfileComplete: boolean;
  role: 'passenger' | 'driver';
  homeLocation?: Location;
  officeLocation?: Location;
  createdAt: string;
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
  joinedAsDriverAt: string;
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
export type RideStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type RideDirection = 'to_office' | 'from_office';

export interface Ride {
  id: string;
  driverId: string;
  vehicleId: string;
  startLocation: Location;
  endLocation: Location;
  direction: RideDirection;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  costPerSeat: number;
  status: RideStatus;
  route?: string;
  createdAt: string;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  totalCost: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  bookedAt: string;
  cancelledAt?: string;
  completedAt?: string;
}

// Payment Types
export type PaymentMethod = 'upi' | 'card' | 'wallet';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'success' | 'failed';
  transactionId?: string;
  createdAt: string;
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
  createdAt: string;
}

// Session Types
export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

// OTP Types
export interface OTPVerification {
  phone: string;
  otp: string;
  expiresAt: string;
  verified: boolean;
}
