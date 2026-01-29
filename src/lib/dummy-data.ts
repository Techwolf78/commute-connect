import { User, Driver, Vehicle, Ride, Booking, Rating, Location } from '../types';
import { 
  setUsers, setDrivers, setVehicles, setRides, 
  setBookings, setRatings, isInitialized, setInitialized 
} from './storage';

// Utility to generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 15);

// Sample Locations
export const SAMPLE_LOCATIONS: Location[] = [
  {
    id: 'loc_1',
    name: 'Cyber Hub',
    address: 'DLF Cyber City, Gurugram, Haryana 122002',
    latitude: 28.4949,
    longitude: 77.0887,
  },
  {
    id: 'loc_2',
    name: 'Sector 29',
    address: 'Sector 29, Gurugram, Haryana 122001',
    latitude: 28.4595,
    longitude: 77.0266,
  },
  {
    id: 'loc_3',
    name: 'Golf Course Road',
    address: 'Golf Course Road, Gurugram, Haryana 122002',
    latitude: 28.4396,
    longitude: 77.1025,
  },
  {
    id: 'loc_4',
    name: 'MG Road',
    address: 'MG Road, Gurugram, Haryana 122001',
    latitude: 28.4798,
    longitude: 77.0179,
  },
  {
    id: 'loc_5',
    name: 'Sohna Road',
    address: 'Sohna Road, Gurugram, Haryana 122018',
    latitude: 28.4134,
    longitude: 77.0467,
  },
  {
    id: 'loc_6',
    name: 'Udyog Vihar',
    address: 'Udyog Vihar, Gurugram, Haryana 122016',
    latitude: 28.5012,
    longitude: 77.0831,
  },
];

// Create dummy users
const createDummyUsers = (): Record<string, User> => {
  const users: Record<string, User> = {
    user_1: {
      id: 'user_1',
      phone: '+91 9876543210',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      profilePhoto: undefined,
      isProfileComplete: true,
      role: 'driver',
      homeLocation: SAMPLE_LOCATIONS[1],
      officeLocation: SAMPLE_LOCATIONS[0],
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    user_2: {
      id: 'user_2',
      phone: '+91 9876543211',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      profilePhoto: undefined,
      isProfileComplete: true,
      role: 'passenger',
      homeLocation: SAMPLE_LOCATIONS[2],
      officeLocation: SAMPLE_LOCATIONS[0],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    user_3: {
      id: 'user_3',
      phone: '+91 9876543212',
      name: 'Amit Kumar',
      email: 'amit.kumar@example.com',
      profilePhoto: undefined,
      isProfileComplete: true,
      role: 'driver',
      homeLocation: SAMPLE_LOCATIONS[3],
      officeLocation: SAMPLE_LOCATIONS[5],
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    user_4: {
      id: 'user_4',
      phone: '+91 9876543213',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@example.com',
      profilePhoto: undefined,
      isProfileComplete: true,
      role: 'passenger',
      homeLocation: SAMPLE_LOCATIONS[4],
      officeLocation: SAMPLE_LOCATIONS[0],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    user_5: {
      id: 'user_5',
      phone: '+91 9876543214',
      name: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      profilePhoto: undefined,
      isProfileComplete: true,
      role: 'driver',
      homeLocation: SAMPLE_LOCATIONS[1],
      officeLocation: SAMPLE_LOCATIONS[5],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
  return users;
};

// Create dummy drivers
const createDummyDrivers = (): Record<string, Driver> => {
  return {
    user_1: {
      userId: 'user_1',
      vehicleId: 'vehicle_1',
      isVerified: true,
      rating: 4.8,
      totalRides: 156,
      joinedAsDriverAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
    },
    user_3: {
      userId: 'user_3',
      vehicleId: 'vehicle_2',
      isVerified: true,
      rating: 4.6,
      totalRides: 89,
      joinedAsDriverAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    },
    user_5: {
      userId: 'user_5',
      vehicleId: 'vehicle_3',
      isVerified: true,
      rating: 4.9,
      totalRides: 45,
      joinedAsDriverAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
};

// Create dummy vehicles
const createDummyVehicles = (): Record<string, Vehicle> => {
  return {
    vehicle_1: {
      id: 'vehicle_1',
      driverId: 'user_1',
      make: 'Maruti Suzuki',
      model: 'Swift Dzire',
      year: 2022,
      color: 'White',
      licensePlate: 'HR 26 AB 1234',
      seats: 4,
    },
    vehicle_2: {
      id: 'vehicle_2',
      driverId: 'user_3',
      make: 'Hyundai',
      model: 'Creta',
      year: 2023,
      color: 'Black',
      licensePlate: 'DL 4C CD 5678',
      seats: 5,
    },
    vehicle_3: {
      id: 'vehicle_3',
      driverId: 'user_5',
      make: 'Honda',
      model: 'City',
      year: 2021,
      color: 'Silver',
      licensePlate: 'HR 51 EF 9012',
      seats: 4,
    },
  };
};

// Create dummy rides
const createDummyRides = (): Record<string, Ride> => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 30, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(9, 0, 0, 0);

  const evening = new Date();
  evening.setDate(evening.getDate() + 1);
  evening.setHours(18, 0, 0, 0);

  return {
    ride_1: {
      id: 'ride_1',
      driverId: 'user_1',
      vehicleId: 'vehicle_1',
      startLocation: SAMPLE_LOCATIONS[1],
      endLocation: SAMPLE_LOCATIONS[0],
      direction: 'to_office',
      departureTime: tomorrow.toISOString(),
      availableSeats: 2,
      totalSeats: 3,
      costPerSeat: 80,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    },
    ride_2: {
      id: 'ride_2',
      driverId: 'user_3',
      vehicleId: 'vehicle_2',
      startLocation: SAMPLE_LOCATIONS[3],
      endLocation: SAMPLE_LOCATIONS[5],
      direction: 'to_office',
      departureTime: tomorrow.toISOString(),
      availableSeats: 4,
      totalSeats: 4,
      costPerSeat: 100,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    },
    ride_3: {
      id: 'ride_3',
      driverId: 'user_5',
      vehicleId: 'vehicle_3',
      startLocation: SAMPLE_LOCATIONS[0],
      endLocation: SAMPLE_LOCATIONS[1],
      direction: 'from_office',
      departureTime: evening.toISOString(),
      availableSeats: 3,
      totalSeats: 3,
      costPerSeat: 75,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    },
    ride_4: {
      id: 'ride_4',
      driverId: 'user_1',
      vehicleId: 'vehicle_1',
      startLocation: SAMPLE_LOCATIONS[1],
      endLocation: SAMPLE_LOCATIONS[0],
      direction: 'to_office',
      departureTime: dayAfter.toISOString(),
      availableSeats: 3,
      totalSeats: 3,
      costPerSeat: 80,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    },
  };
};

// Create dummy bookings
const createDummyBookings = (): Record<string, Booking> => {
  return {
    booking_1: {
      id: 'booking_1',
      rideId: 'ride_1',
      passengerId: 'user_2',
      seatsBooked: 1,
      totalCost: 80,
      status: 'confirmed',
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      bookedAt: new Date().toISOString(),
    },
  };
};

// Create dummy ratings
const createDummyRatings = (): Record<string, Rating> => {
  return {
    rating_1: {
      id: 'rating_1',
      bookingId: 'booking_old_1',
      rideId: 'ride_old_1',
      fromUserId: 'user_2',
      toUserId: 'user_1',
      rating: 5,
      comment: 'Great ride! Very punctual and comfortable.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    rating_2: {
      id: 'rating_2',
      bookingId: 'booking_old_2',
      rideId: 'ride_old_2',
      fromUserId: 'user_4',
      toUserId: 'user_1',
      rating: 4,
      comment: 'Good experience.',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
};

// Initialize all dummy data
export const initializeDummyData = () => {
  if (isInitialized()) {
    return;
  }

  setUsers(createDummyUsers());
  setDrivers(createDummyDrivers());
  setVehicles(createDummyVehicles());
  setRides(createDummyRides());
  setBookings(createDummyBookings());
  setRatings(createDummyRatings());
  setInitialized(true);
};

// Reset to fresh dummy data (for testing)
export const resetDummyData = () => {
  setInitialized(false);
  initializeDummyData();
};
