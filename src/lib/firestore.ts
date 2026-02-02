import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type Query,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { isRideExpired } from './utils';
import {
  User,
  Driver,
  Vehicle,
  Ride,
  Booking,
  Rating,
  Location,
  Notification,
  Chat,
  Message
} from '../types';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  RIDES: 'rides',
  BOOKINGS: 'bookings',
  RATINGS: 'ratings',
  NOTIFICATIONS: 'notifications',
  CHATS: 'chats',
  MESSAGES: 'messages',
} as const;

// Utility functions
export const createTimestamp = () => Timestamp.now();

export const timestampToDate = (timestamp: Timestamp) => timestamp.toDate();

export const dateToTimestamp = (date: Date) => Timestamp.fromDate(date);

// Convert Timestamps to Dates recursively in an object
const convertTimestampsToDates = (obj: unknown): unknown => {
  if (obj instanceof Timestamp) {
    return obj.toDate();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertTimestampsToDates);
  }
  if (obj !== null && typeof obj === 'object') {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      converted[key] = convertTimestampsToDates(value);
    }
    return converted;
  }
  return obj;
};

// Generic Firestore operations
export class FirestoreService {
  // Create document
  static async createDocument<T extends DocumentData>(
    collectionName: string,
    id: string,
    data: T
  ): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, {
      ...data,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
    });
  }

  // Create document with auto-generated ID
  static async createDocumentWithId<T extends DocumentData>(
    collectionName: string,
    data: Omit<T, 'id'>
  ): Promise<T> {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
    });
    return { id: docRef.id, ...data } as unknown as T;
  }

  // Update document (creates if doesn't exist)
  static async updateDocument<T extends DocumentData>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, {
      ...data,
      updatedAt: createTimestamp(),
    }, { merge: true });
  }

  // Get document
  static async getDocument<T>(
    collectionName: string,
    id: string
  ): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { id, ...(data ? convertTimestampsToDates(data) as Record<string, unknown> : {}) } as T;
    }
    return null;
  }

  // Delete document
  static async deleteDocument(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  }

  // Get all documents in collection
  static async getAllDocuments<T>(collectionName: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  // Query documents
  static async queryDocuments<T>(
    collectionName: string,
    conditions: Array<{
      field: string;
      operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
      value: unknown;
    }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc',
    limitCount?: number
  ): Promise<T[]> {
    let q: Query<DocumentData, DocumentData> = collection(db, collectionName);

    // Apply where conditions
    conditions.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });

    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...(data ? convertTimestampsToDates(data) as Record<string, unknown> : {}) } as T;
    });
  }

  // Subscribe to document changes
  static subscribeToDocument<T>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionName, id);
    return onSnapshot(docRef, (docSnap) => {
      const data = docSnap.exists() ? ({ id: docSnap.id, ...(docSnap.data() ? convertTimestampsToDates(docSnap.data()!) as Record<string, unknown> : {}) } as T) : null;
      callback(data);
    });
  }

  // Subscribe to collection changes
  static subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    conditions?: Array<{
      field: string;
      operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
      value: unknown;
    }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Unsubscribe {
    let q: Query<DocumentData, DocumentData> = collection(db, collectionName);

    // Apply where conditions
    if (conditions) {
      conditions.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });
    }

    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() ? convertTimestampsToDates(doc.data()) as Record<string, unknown> : {}) } as T));
      callback(data);
    });
  }

  // Listen to collection changes with real-time updates
  static listenToCollection<T>(
    collectionName: string,
    conditions: Array<{
      field: string;
      operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
      value: unknown;
    }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc',
    callback?: (data: T[]) => void
  ): Unsubscribe {
    let q: Query<DocumentData, DocumentData> = collection(db, collectionName);

    // Apply where conditions
    conditions.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });

    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() ? convertTimestampsToDates(doc.data()) as Record<string, unknown> : {}) } as T));
      if (callback) {
        callback(data);
      }
    });
  }
}

// User operations
export const userService = {
  async createUser(userData: User): Promise<void> {
    const { id, ...dataWithoutId } = userData;
    await FirestoreService.createDocument(COLLECTIONS.USERS, id, dataWithoutId);
  },

  async getUser(userId: string): Promise<User | null> {
    return FirestoreService.getDocument<User>(COLLECTIONS.USERS, userId);
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.USERS, userId, updates);
  },

  subscribeToUser(userId: string, callback: (user: User | null) => void): Unsubscribe {
    return FirestoreService.subscribeToDocument<User>(COLLECTIONS.USERS, userId, callback);
  },
};

// Driver operations
export const driverService = {
  async createDriver(driverData: Driver): Promise<void> {
    await FirestoreService.createDocument(COLLECTIONS.DRIVERS, driverData.userId, driverData);
  },

  async getDriver(userId: string): Promise<Driver | null> {
    return FirestoreService.getDocument<Driver>(COLLECTIONS.DRIVERS, userId);
  },

  async updateDriver(userId: string, updates: Partial<Driver>): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.DRIVERS, userId, updates);
  },
};

// Vehicle operations
export const vehicleService = {
  async createVehicle(vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    return FirestoreService.createDocumentWithId<Vehicle>(COLLECTIONS.VEHICLES, vehicleData);
  },

  async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    return FirestoreService.getDocument<Vehicle>(COLLECTIONS.VEHICLES, vehicleId);
  },

  async getVehiclesByDriver(driverId: string): Promise<Vehicle[]> {
    return FirestoreService.queryDocuments<Vehicle>(
      COLLECTIONS.VEHICLES,
      [{ field: 'driverId', operator: '==', value: driverId }]
    );
  },

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.VEHICLES, vehicleId, updates);
  },
};

// Ride operations
export const rideService = {
  async createRide(rideData: Omit<Ride, 'id'>): Promise<Ride> {
    return FirestoreService.createDocumentWithId<Ride>(COLLECTIONS.RIDES, rideData);
  },

  async getRide(rideId: string): Promise<Ride | null> {
    return FirestoreService.getDocument<Ride>(COLLECTIONS.RIDES, rideId);
  },

  async getRidesByDriver(driverId: string): Promise<Ride[]> {
    return FirestoreService.queryDocuments<Ride>(
      COLLECTIONS.RIDES,
      [{ field: 'driverId', operator: '==', value: driverId }]
    );
  },

  async getAvailableRides(
    startLocationName?: string,
    endLocationName?: string,
    direction?: string,
    date?: Date
  ): Promise<Ride[]> {
    console.log('🔍 Firestore: getAvailableRides called with params:', {
      startLocationName,
      endLocationName,
      direction,
      date
    });
    
    const conditions = [];
    console.log('📋 Firestore: Building query conditions...');

    // Filter for available rides only
    conditions.push({ field: 'status', operator: '==', value: 'AVAILABLE' });
    console.log('✅ Firestore: Added status filter: AVAILABLE');

    // Temporarily remove future time filter to show all rides for testing
    // conditions.push({ field: 'departureTime', operator: '>', value: createTimestamp() });
    console.log('⏰ Firestore: Time filter commented out for testing');

    if (direction && direction !== 'all') {
      conditions.push({ field: 'direction', operator: '==', value: direction });
      console.log('🎯 Firestore: Added direction filter:', direction);
    }

    if (startLocationName) {
      console.log('📍 Firestore: startLocationName filter requested but not supported');
    }

    if (endLocationName) {
      console.log('📍 Firestore: endLocationName filter requested but not supported');
    }

    if (date) {
      console.log('📅 Firestore: Adding date filter for:', date);
      // Filter rides for the specific date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      conditions.push({ field: 'departureTime', operator: '>=', value: dateToTimestamp(startOfDay) });
      conditions.push({ field: 'departureTime', operator: '<=', value: dateToTimestamp(endOfDay) });
    }

    console.log('🔍 Firestore: Final conditions:', conditions);

    try {
      console.log('🚀 Firestore: Executing queryDocuments...');
      const rides = await FirestoreService.queryDocuments<Ride>(
        COLLECTIONS.RIDES,
        conditions,
        'departureTime'
      );
      
      console.log('📊 Firestore: Query result:', rides);
      console.log('🔢 Firestore: Total rides found:', rides.length);
      
      // Filter out expired rides
      const validRides = rides.filter(ride => !isRideExpired(ride.departureTime));
      console.log('⏰ Firestore: After filtering expired rides:', validRides.length);
      
      // Log details of each ride found
      validRides.forEach((ride, index) => {
        console.log(`🚗 Firestore: Ride ${index + 1}:`, {
          id: ride.id,
          status: ride.status,
          driverId: ride.driverId,
          direction: ride.direction,
          departureTime: ride.departureTime,
          startLocation: ride.startLocation?.name,
          endLocation: ride.endLocation?.name
        });
      });
      
      return validRides;
    } catch (error) {
      console.error('❌ Firestore: Error in getAvailableRides:', error);
      throw error;
    }
  },

  async updateRide(rideId: string, updates: Partial<Ride>): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.RIDES, rideId, updates);
  },

  // Ride execution functions
  async driverReachedPickup(rideId: string): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.RIDES, rideId, {
      status: 'DRIVER_REACHED_PICKUP',
      pickupReachedAt: createTimestamp(),
    });
  },

  async passengerArrived(rideId: string): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.RIDES, rideId, {
      status: 'PASSENGER_ARRIVED',
      passengerArrivedAt: createTimestamp(),
    });
  },

  async startTrip(rideId: string, estimatedArrivalTime: Date | string): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.RIDES, rideId, {
      status: 'TRIP_STARTED',
      tripStartedAt: createTimestamp(),
      estimatedArrivalTime,
    });
  },

  async arrivedAtDestination(rideId: string): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.RIDES, rideId, {
      status: 'DESTINATION_REACHED',
      destinationReachedAt: createTimestamp(),
    });
  },

  async paymentCollected(rideId: string): Promise<void> {
    // First update the ride status
    await FirestoreService.updateDocument(COLLECTIONS.RIDES, rideId, {
      status: 'COMPLETED',
      paymentCollected: true,
      rideCompletedAt: createTimestamp(),
    });

    // Then update all bookings for this ride to completed status
    const bookings = await FirestoreService.queryDocuments<Booking>(
      COLLECTIONS.BOOKINGS,
      [{ field: 'rideId', operator: '==', value: rideId }]
    );

    const updatePromises = bookings.map(booking =>
      FirestoreService.updateDocument(COLLECTIONS.BOOKINGS, booking.id, {
        status: 'completed',
        completedAt: createTimestamp(),
      })
    );

    await Promise.all(updatePromises);
  },

  subscribeToRide(rideId: string, callback: (ride: Ride | null) => void): Unsubscribe {
    return FirestoreService.subscribeToDocument<Ride>(COLLECTIONS.RIDES, rideId, callback);
  },

  async getAllRides(): Promise<Ride[]> {
    return FirestoreService.getAllDocuments<Ride>(COLLECTIONS.RIDES);
  },

  async updateExpiredRides(): Promise<void> {
    console.log('⏰ Firestore: Checking for expired rides...');
    try {
      // Get all available rides
      const availableRides = await FirestoreService.queryDocuments<Ride>(
        COLLECTIONS.RIDES,
        [{ field: 'status', operator: '==', value: 'AVAILABLE' }]
      );

      console.log(`📊 Firestore: Found ${availableRides.length} available rides to check for expiration`);

      let expiredCount = 0;
      for (const ride of availableRides) {
        if (isRideExpired(ride.departureTime)) {
          console.log(`⏰ Firestore: Marking ride ${ride.id} as EXPIRED (departure: ${ride.departureTime})`);
          await this.updateRide(ride.id, { status: 'EXPIRED' });
          expiredCount++;
        }
      }

      console.log(`✅ Firestore: Marked ${expiredCount} rides as EXPIRED`);
    } catch (error) {
      console.error('❌ Firestore: Error updating expired rides:', error);
      throw error;
    }
  },

  async recalculateAvailableSeats(rideId: string): Promise<void> {
    const ride = await this.getRide(rideId);
    if (!ride) return;

    const bookings = await bookingService.getBookingsByRide(rideId);
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const bookedSeats = confirmedBookings.reduce((total, booking) => total + booking.seatsBooked, 0);
    const correctAvailableSeats = ride.totalSeats - bookedSeats;

    const updates: Partial<Ride> = { availableSeats: correctAvailableSeats };

    // Update status based on bookings
    if (bookedSeats > 0 && ride.status === 'AVAILABLE') {
      updates.status = 'BOOKED';
    } else if (bookedSeats === 0 && ride.status === 'BOOKED') {
      updates.status = 'AVAILABLE';
    }

    await this.updateRide(rideId, updates);
  },

  async cancelRide(rideId: string, reason: string, cancelledByUserId: string): Promise<void> {
    const ride = await this.getRide(rideId);
    if (!ride) throw new Error('Ride not found');

    const updates: Partial<Ride> = {
      status: 'EXPIRED', // Using EXPIRED status for cancelled rides
      cancelledAt: new Date(),
      cancellationReason: reason,
      cancelledBy: cancelledByUserId,
      updatedAt: new Date(),
    };
    await this.updateRide(rideId, updates);

    // Also cancel all associated bookings and notify passengers
    const bookings = await bookingService.getBookingsByRide(rideId);
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');

    for (const booking of activeBookings) {
      await bookingService.cancelBooking(booking.id, `Ride cancelled by driver: ${reason}`, 'driver');
    }

    // Create notification for driver (confirmation)
    await notificationService.createNotification({
      userId: cancelledByUserId,
      type: 'ride_cancelled',
      title: 'Ride Cancelled',
      message: `Your ride from ${ride.startLocation.name} to ${ride.endLocation.name} has been cancelled. All passengers have been notified.`,
      relatedId: rideId,
      isRead: false,
      createdAt: new Date(),
    });
  },
};

// Booking operations
export const bookingService = {
  async createBooking(bookingData: Omit<Booking, 'id'>): Promise<Booking> {
    return FirestoreService.createDocumentWithId<Booking>(COLLECTIONS.BOOKINGS, bookingData);
  },

  async getBooking(bookingId: string): Promise<Booking | null> {
    return FirestoreService.getDocument<Booking>(COLLECTIONS.BOOKINGS, bookingId);
  },

  async getBookingsByPassenger(passengerId: string): Promise<Booking[]> {
    return FirestoreService.queryDocuments<Booking>(
      COLLECTIONS.BOOKINGS,
      [{ field: 'passengerId', operator: '==', value: passengerId }]
    );
  },

  async getBookingsByRide(rideId: string): Promise<Booking[]> {
    return FirestoreService.queryDocuments<Booking>(
      COLLECTIONS.BOOKINGS,
      [{ field: 'rideId', operator: '==', value: rideId }]
    );
  },

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.BOOKINGS, bookingId, updates);
  },

  async cancelBooking(bookingId: string, reason: string, cancelledBy: 'passenger' | 'driver'): Promise<void> {
    const booking = await this.getBooking(bookingId);
    if (!booking) throw new Error('Booking not found');

    const updates: Partial<Booking> = {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
      cancelledBy,
      updatedAt: new Date(),
    };
    await this.updateBooking(bookingId, updates);

    // Create notification for the other party
    const ride = await rideService.getRide(booking.rideId);
    if (!ride) return;

    if (cancelledBy === 'passenger') {
      // Notify driver
      await notificationService.createNotification({
        userId: ride.driverId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `A passenger has cancelled their booking for your ride from ${ride.startLocation.name} to ${ride.endLocation.name}. Reason: ${reason}`,
        relatedId: bookingId,
        isRead: false,
        createdAt: new Date(),
      });
    } else {
      // Notify passenger
      await notificationService.createNotification({
        userId: booking.passengerId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Your booking for the ride from ${ride.startLocation.name} to ${ride.endLocation.name} has been cancelled by the driver. Reason: ${reason}`,
        relatedId: bookingId,
        isRead: false,
        createdAt: new Date(),
      });
    }

    // Update ride available seats
    await rideService.recalculateAvailableSeats(booking.rideId);
  },

  async cancelRide(rideId: string, reason: string, cancelledByUserId: string): Promise<void> {
    const ride = await rideService.getRide(rideId);
    if (!ride) throw new Error('Ride not found');

    const updates: Partial<Ride> = {
      status: 'EXPIRED', // Using EXPIRED status for cancelled rides
      cancelledAt: new Date(),
      cancellationReason: reason,
      cancelledBy: cancelledByUserId,
      updatedAt: new Date(),
    };
    await rideService.updateRide(rideId, updates);

    // Also cancel all associated bookings and notify passengers
    const bookings = await this.getBookingsByRide(rideId);
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');

    for (const booking of activeBookings) {
      await this.cancelBooking(booking.id, `Ride cancelled by driver: ${reason}`, 'driver');
    }

    // Create notification for driver (confirmation)
    await notificationService.createNotification({
      userId: cancelledByUserId,
      type: 'ride_cancelled',
      title: 'Ride Cancelled',
      message: `Your ride from ${ride.startLocation.name} to ${ride.endLocation.name} has been cancelled. All passengers have been notified.`,
      relatedId: rideId,
      isRead: false,
      createdAt: new Date(),
    });
  },
};

// Rating operations
export const ratingService = {
  async createRating(ratingData: Omit<Rating, 'id'>): Promise<Rating> {
    return FirestoreService.createDocumentWithId<Rating>(COLLECTIONS.RATINGS, ratingData);
  },

  async getRating(ratingId: string): Promise<Rating | null> {
    return FirestoreService.getDocument<Rating>(COLLECTIONS.RATINGS, ratingId);
  },

  async getRatingsForUser(userId: string): Promise<Rating[]> {
    return FirestoreService.queryDocuments<Rating>(
      COLLECTIONS.RATINGS,
      [{ field: 'toUserId', operator: '==', value: userId }],
      'createdAt'
    );
  },

  async getRatingsByBooking(bookingId: string): Promise<Rating[]> {
    return FirestoreService.queryDocuments<Rating>(
      COLLECTIONS.RATINGS,
      [{ field: 'bookingId', operator: '==', value: bookingId }]
    );
  },
};

// Notification operations
export const notificationService = {
  async createNotification(notificationData: Omit<Notification, 'id'>): Promise<Notification> {
    return FirestoreService.createDocumentWithId<Notification>(COLLECTIONS.NOTIFICATIONS, notificationData);
  },

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return FirestoreService.queryDocuments<Notification>(
      COLLECTIONS.NOTIFICATIONS,
      [{ field: 'userId', operator: '==', value: userId }],
      'createdAt'
    );
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await FirestoreService.updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
      isRead: true,
      updatedAt: new Date(),
    });
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotificationsForUser(userId);
    const unreadNotifications = notifications.filter(n => !n.isRead);

    for (const notification of unreadNotifications) {
      await this.markNotificationAsRead(notification.id);
    }
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const notifications = await this.getNotificationsForUser(userId);
    return notifications.filter(n => !n.isRead).length;
  },
};

// Chat Service
export const chatService = {
  // Get chat by ID
  async getChat(chatId: string): Promise<Chat> {
    return FirestoreService.getDocument<Chat>(COLLECTIONS.CHATS, chatId);
  },

  // Create or get existing chat between two users for a specific ride
  async getOrCreateChat(participant1Id: string, participant2Id: string, rideId: string): Promise<Chat> {
    // Create a consistent chat ID by sorting participant IDs
    const participants = [participant1Id, participant2Id].sort();
    const chatId = `${participants[0]}_${participants[1]}_${rideId}`;

    // Try to get existing chat
    const existingChat = await FirestoreService.getDocument<Chat>(COLLECTIONS.CHATS, chatId);
    if (existingChat) {
      return existingChat;
    }

    // Create new chat
    const newChat: Omit<Chat, 'id'> = {
      participants,
      rideId,
      createdAt: new Date(),
    };

    await FirestoreService.createDocument(COLLECTIONS.CHATS, chatId, newChat);
    return { id: chatId, ...newChat };
  },

  // Get all chats for a user
  async getChatsForUser(userId: string): Promise<Chat[]> {
    try {
      const result = await FirestoreService.queryDocuments<Chat>(
        COLLECTIONS.CHATS,
        [{ field: 'participants', operator: 'array-contains', value: userId }]
      );

      // If no chats found, return empty array
      if (!result || result.length === 0) {
        return [];
      }

      // Sort by lastMessageTimestamp if available, otherwise by createdAt
      const sortedResult = result.sort((a, b) => {
        const aTime = a.lastMessageTimestamp || a.createdAt;
        const bTime = b.lastMessageTimestamp || b.createdAt;
        return bTime.getTime() - aTime.getTime();
      });

      return sortedResult;
    } catch (error) {
      console.error('Error fetching chats for user:', error);
      return [];
    }
  },

  // Send a message
  async sendMessage(chatId: string, senderId: string, text: string): Promise<Message> {
    console.log('🔥 chatService: sendMessage called with:', { chatId, senderId, text });

    const messageData: Omit<Message, 'id'> = {
      chatId,
      senderId,
      text: text.trim(),
      timestamp: new Date(),
      isRead: false,
    };

    console.log('🔥 chatService: messageData:', messageData);

    const messageId = await FirestoreService.createDocumentWithId(COLLECTIONS.MESSAGES, messageData);
    console.log('🔥 chatService: messageId from createDocumentWithId:', messageId.id);

    // Update chat's last message
    await FirestoreService.updateDocument(COLLECTIONS.CHATS, chatId, {
      lastMessage: text.trim(),
      lastMessageTimestamp: new Date(),
    });
    console.log('🔥 chatService: updated chat lastMessage');

    const result = messageId;
    console.log('🔥 chatService: returning result:', result);
    return result;
  },

  // Get messages for a chat
  async getMessagesForChat(chatId: string): Promise<Message[]> {
    return FirestoreService.queryDocuments<Message>(
      COLLECTIONS.MESSAGES,
      [{ field: 'chatId', operator: '==', value: chatId }],
      [{ field: 'timestamp', direction: 'asc' }]
    );
  },

  // Mark messages as read for a chat
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    // Get all unread messages in this chat that are not sent by the current user
    const messages = await FirestoreService.queryDocuments<Message>(
      COLLECTIONS.MESSAGES,
      [
        { field: 'chatId', operator: '==', value: chatId },
        { field: 'senderId', operator: '!=', value: userId },
        { field: 'isRead', operator: '==', value: false }
      ]
    );

    // Mark each message as read
    for (const message of messages) {
      await FirestoreService.updateDocument(COLLECTIONS.MESSAGES, message.id, {
        isRead: true
      });
    }
  },

  // Get unread message count for a user
  async getUnreadMessageCount(userId: string): Promise<number> {
    const chats = await this.getChatsForUser(userId);
    let totalUnread = 0;

    for (const chat of chats) {
      const unreadMessages = await FirestoreService.queryDocuments<Message>(
        COLLECTIONS.MESSAGES,
        [
          { field: 'chatId', operator: '==', value: chat.id },
          { field: 'senderId', operator: '!=', value: userId },
          { field: 'isRead', operator: '==', value: false }
        ]
      );
      totalUnread += unreadMessages.length;
    }

    return totalUnread;
  },

  // Get unread message counts per chat for a user
  async getUnreadCountsPerChat(userId: string): Promise<{ [chatId: string]: number }> {
    const chats = await this.getChatsForUser(userId);
    const counts: { [chatId: string]: number } = {};

    for (const chat of chats) {
      const unreadMessages = await FirestoreService.queryDocuments<Message>(
        COLLECTIONS.MESSAGES,
        [
          { field: 'chatId', operator: '==', value: chat.id },
          { field: 'senderId', operator: '!=', value: userId },
          { field: 'isRead', operator: '==', value: false }
        ]
      );
      if (unreadMessages.length > 0) {
        counts[chat.id] = unreadMessages.length;
      }
    }

    return counts;
  },

  // Listen to messages in real-time
  listenToMessages(chatId: string, callback: (messages: Message[]) => void): Unsubscribe {
    return FirestoreService.subscribeToCollection(
      COLLECTIONS.MESSAGES,
      callback,
      [{ field: 'chatId', operator: '==', value: chatId }],
      'timestamp',
      'asc'
    );
  },

  // Listen to chats for a user in real-time
  listenToUserChats(userId: string, callback: (chats: Chat[]) => void): Unsubscribe {
    return FirestoreService.subscribeToCollection(
      COLLECTIONS.CHATS,
      callback,
      [{ field: 'participants', operator: 'array-contains', value: userId }],
      'lastMessageTimestamp',
      'desc'
    );
  },
};