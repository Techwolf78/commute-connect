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
export type RideStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
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
  totalCost: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  bookedAt: Date;
  cancelledAt?: Date;
  completedAt?: Date;
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
  createdAt: Date;
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
