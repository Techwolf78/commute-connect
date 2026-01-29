// LocalStorage Keys
const STORAGE_KEYS = {
  SESSION: 'carpool_session',
  USERS: 'carpool_users',
  DRIVERS: 'carpool_drivers',
  VEHICLES: 'carpool_vehicles',
  RIDES: 'carpool_rides',
  BOOKINGS: 'carpool_bookings',
  RATINGS: 'carpool_ratings',
  PAYMENTS: 'carpool_payments',
  OTP: 'carpool_otp',
  INITIALIZED: 'carpool_initialized',
} as const;

// Generic Storage Functions
export function getItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Session Management
export function getSession() {
  return getItem<{ userId: string; token: string; expiresAt: string }>(STORAGE_KEYS.SESSION);
}

export function setSession(session: { userId: string; token: string; expiresAt: string }) {
  setItem(STORAGE_KEYS.SESSION, session);
}

export function clearSession() {
  removeItem(STORAGE_KEYS.SESSION);
}

// Entity-specific functions
export function getUsers() {
  return getItem<Record<string, import('../types').User>>(STORAGE_KEYS.USERS) || {};
}

export function setUsers(users: Record<string, import('../types').User>) {
  setItem(STORAGE_KEYS.USERS, users);
}

export function getDrivers() {
  return getItem<Record<string, import('../types').Driver>>(STORAGE_KEYS.DRIVERS) || {};
}

export function setDrivers(drivers: Record<string, import('../types').Driver>) {
  setItem(STORAGE_KEYS.DRIVERS, drivers);
}

export function getVehicles() {
  return getItem<Record<string, import('../types').Vehicle>>(STORAGE_KEYS.VEHICLES) || {};
}

export function setVehicles(vehicles: Record<string, import('../types').Vehicle>) {
  setItem(STORAGE_KEYS.VEHICLES, vehicles);
}

export function getRides() {
  return getItem<Record<string, import('../types').Ride>>(STORAGE_KEYS.RIDES) || {};
}

export function setRides(rides: Record<string, import('../types').Ride>) {
  setItem(STORAGE_KEYS.RIDES, rides);
}

export function getBookings() {
  return getItem<Record<string, import('../types').Booking>>(STORAGE_KEYS.BOOKINGS) || {};
}

export function setBookings(bookings: Record<string, import('../types').Booking>) {
  setItem(STORAGE_KEYS.BOOKINGS, bookings);
}

export function getRatings() {
  return getItem<Record<string, import('../types').Rating>>(STORAGE_KEYS.RATINGS) || {};
}

export function setRatings(ratings: Record<string, import('../types').Rating>) {
  setItem(STORAGE_KEYS.RATINGS, ratings);
}

export function getPayments() {
  return getItem<Record<string, import('../types').Payment>>(STORAGE_KEYS.PAYMENTS) || {};
}

export function setPayments(payments: Record<string, import('../types').Payment>) {
  setItem(STORAGE_KEYS.PAYMENTS, payments);
}

export function getOTP() {
  return getItem<import('../types').OTPVerification>(STORAGE_KEYS.OTP);
}

export function setOTP(otp: import('../types').OTPVerification) {
  setItem(STORAGE_KEYS.OTP, otp);
}

export function clearOTP() {
  removeItem(STORAGE_KEYS.OTP);
}

export function isInitialized() {
  return getItem<boolean>(STORAGE_KEYS.INITIALIZED) || false;
}

export function setInitialized(value: boolean) {
  setItem(STORAGE_KEYS.INITIALIZED, value);
}

export { STORAGE_KEYS };
