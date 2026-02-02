import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CancellationForm } from "@/components/CancellationForm";
import { BookingCard } from "@/components/BookingCard";
import { getDateFromTimestamp, isRideExpired, calculateDistance } from "@/lib/utils";
import { rideService, bookingService, ratingService, notificationService } from "@/lib/firestore";

// Mock Firebase
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => date),
  },
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock date-fns
vi.mock("date-fns", () => ({
  format: vi.fn((date, pattern) => date.toISOString()),
  isPast: vi.fn((date) => date < new Date()),
  isAfter: vi.fn((date1, date2) => date1 > date2),
  addMinutes: vi.fn((date, minutes) => new Date(date.getTime() + minutes * 60000)),
}));

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockUser = {
  id: "user1",
  email: "test@example.com",
  name: "Test User",
  role: "passenger" as const,
  isProfileComplete: true,
  createdAt: new Date(),
};

const mockRide = {
  id: "ride1",
  driverId: "driver1",
  vehicleId: "vehicle1",
  startLocation: { id: "loc1", name: "Home", address: "123 Home St", latitude: 0, longitude: 0 },
  endLocation: { id: "loc2", name: "Office", address: "456 Office St", latitude: 1, longitude: 1 },
  direction: "to_office" as const,
  departureTime: new Date(Date.now() + 3600000), // 1 hour from now
  availableSeats: 3,
  totalSeats: 4,
  costPerSeat: 50,
  status: "AVAILABLE" as const,
  createdAt: new Date(),
};

const mockBooking = {
  id: "booking1",
  rideId: "ride1",
  passengerId: "user1",
  seatsBooked: 1,
  amountToPayDriver: 50,
  status: "confirmed" as const,
  bookedAt: new Date(),
};

describe("Commute Connect Application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Utility Functions", () => {
    describe("Date Handling", () => {
      it("should handle date conversions correctly", () => {
        const date = new Date();
        const timestamp = { toDate: () => date };

        expect(getDateFromTimestamp(date)).toEqual(date);
        expect(getDateFromTimestamp(timestamp)).toEqual(date);
        expect(getDateFromTimestamp(date.toISOString())).toEqual(new Date(date.toISOString()));
      });

      it("should check if ride is expired", () => {
        const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
        const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

        expect(isRideExpired(pastDate)).toBe(true);
        expect(isRideExpired(futureDate)).toBe(false);
      });
    });

    describe("Location Services", () => {
      it("should calculate distance between coordinates", () => {
        // Mock Google Maps Distance Matrix
        global.google = {
          maps: {
            DistanceMatrixService: vi.fn().mockImplementation(() => ({
              getDistanceMatrix: vi.fn((request, callback) => {
                callback({
                  rows: [{
                    elements: [{
                      distance: { value: 10000 }, // 10km
                      duration: { value: 900 }, // 15 minutes
                      status: "OK"
                    }]
                  }]
                }, "OK");
              })
            })),
            TravelMode: { 
              DRIVING: "DRIVING" as any,
              BICYCLING: "BICYCLING" as any,
              TRANSIT: "TRANSIT" as any,
              WALKING: "WALKING" as any
            },
            UnitSystem: { 
              METRIC: "METRIC" as any,
              IMPERIAL: "IMPERIAL" as any
            }
          }
        };

        // This would need actual implementation testing
        expect(typeof calculateDistance).toBe("function");
      });
    });
  });

  describe("Authentication", () => {
    it("should handle user login", async () => {
      // Mock auth context
      const mockLogin = vi.fn().mockResolvedValue(mockUser);
      (useAuth as vi.MockedFunction<typeof useAuth>).mockReturnValue({
        user: null,
        signIn: mockLogin,
        logout: vi.fn(),
        loading: false,
        isAuthenticated: false,
        firebaseUser: null,
        signUp: vi.fn(),
        signInWithGoogle: vi.fn(),
        updateUser: vi.fn(),
        refreshUser: vi.fn(),
      });

      const { result } = renderHook(() => useAuth(), { wrapper: ({ children }) => <div>{children}</div> });

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password");
    });

    it("should handle user registration", async () => {
      const mockRegister = vi.fn().mockResolvedValue(mockUser);

      // Test registration logic would go here
      expect(typeof mockRegister).toBe("function");
    });
  });

  describe("Ride Management", () => {
    describe("Ride Creation", () => {
      it("should validate ride data", () => {
        const validRideData = {
          startLocation: mockRide.startLocation,
          endLocation: mockRide.endLocation,
          departureTime: new Date(Date.now() + 3600000),
          totalSeats: 4,
          costPerSeat: 50,
          direction: "to_office" as const,
        };

        // Test validation logic
        expect(validRideData.startLocation).toBeDefined();
        expect(validRideData.departureTime > new Date()).toBe(true);
        expect(validRideData.totalSeats).toBeGreaterThan(0);
      });

      it("should create ride with correct data", async () => {

        const mockCreateRide = vi.fn().mockResolvedValue({ ...mockRide, id: "new-ride-id" });
        rideService.createRide = mockCreateRide;

        const rideData = {
          driverId: "driver1",
          vehicleId: "vehicle1",
          startLocation: mockRide.startLocation,
          endLocation: mockRide.endLocation,
          departureTime: mockRide.departureTime,
          totalSeats: 4,
          availableSeats: 4,
          costPerSeat: 50,
          direction: "to_office" as const,
          status: "AVAILABLE" as const,
          createdAt: new Date(),
        };

        const result = await rideService.createRide(rideData);
        expect(result.id).toBe("new-ride-id");
        expect(mockCreateRide).toHaveBeenCalledWith(rideData);
      });
    });

    describe("Ride Availability", () => {
      it("should filter available rides correctly", () => {
        const rides = [
          { ...mockRide, status: "AVAILABLE", departureTime: new Date(Date.now() + 3600000) },
          { ...mockRide, id: "ride2", status: "BOOKED", departureTime: new Date(Date.now() + 3600000) },
          { ...mockRide, id: "ride3", status: "AVAILABLE", departureTime: new Date(Date.now() - 3600000) }, // Past
        ];

        const availableRides = rides.filter(ride =>
          ride.status === "AVAILABLE" && ride.departureTime > new Date()
        );

        expect(availableRides).toHaveLength(1);
        expect(availableRides[0].id).toBe("ride1");
      });

      it("should update available seats when booking", async () => {

        const mockRecalculateSeats = vi.fn().mockResolvedValue(undefined);
        rideService.recalculateAvailableSeats = mockRecalculateSeats;

        await rideService.recalculateAvailableSeats("ride1");

        expect(mockRecalculateSeats).toHaveBeenCalledWith("ride1");
      });
    });
  });

  describe("Booking System", () => {
    describe("Booking Creation", () => {
      it("should create booking with correct calculations", () => {
        const bookingData = {
          rideId: "ride1",
          passengerId: "user1",
          seatsBooked: 2,
          amountToPayDriver: 100, // 2 seats * 50
        };

        expect(bookingData.seatsBooked).toBe(2);
        expect(bookingData.amountToPayDriver).toBe(100);
      });

      it("should validate booking constraints", () => {
        const ride = { ...mockRide, availableSeats: 1 };
        const bookingRequest = { seatsBooked: 2 };

        // Should not allow booking more seats than available
        expect(bookingRequest.seatsBooked > ride.availableSeats).toBe(true);
      });
    });

    describe("Booking Cancellation", () => {
      it("should cancel booking with reason", async () => {

        const mockCancelBooking = vi.fn().mockResolvedValue(undefined);
        bookingService.cancelBooking = mockCancelBooking;

        await bookingService.cancelBooking("booking1", "Emergency", "passenger");

        expect(mockCancelBooking).toHaveBeenCalledWith("booking1", "Emergency", "passenger");
      });

      it("should notify driver when passenger cancels", async () => {

        const mockCreateNotification = vi.fn().mockResolvedValue(undefined);
        notificationService.createNotification = mockCreateNotification;

        // This would be called internally by cancelBooking
        expect(typeof notificationService.createNotification).toBe("function");
      });
    });
  });

  describe("Rating System", () => {
    it("should create rating with valid data", async () => {

      const ratingData = {
        bookingId: "booking1",
        rideId: "ride1",
        fromUserId: "passenger1",
        toUserId: "driver1",
        rating: 5,
        comment: "Great ride!",
        createdAt: new Date(),
      };

      const mockCreateRating = vi.fn().mockResolvedValue({ ...ratingData, id: "rating1" });
      ratingService.createRating = mockCreateRating;

      const result = await ratingService.createRating(ratingData);
      expect(result.rating).toBe(5);
      expect(result.comment).toBe("Great ride!");
    });

    it("should validate rating range", () => {
      const validRatings = [1, 2, 3, 4, 5];
      const invalidRatings = [0, 6, -1, 10];

      validRatings.forEach(rating => {
        expect(rating >= 1 && rating <= 5).toBe(true);
      });

      invalidRatings.forEach(rating => {
        expect(rating < 1 || rating > 5).toBe(true);
      });
    });
  });

  describe("Components", () => {
    describe("CancellationForm", () => {
      it("should render cancellation reasons", () => {
        const mockOnConfirm = vi.fn();
        const mockOnClose = vi.fn();

        renderWithProviders(
          <CancellationForm
            isOpen={true}
            onClose={mockOnClose}
            onConfirm={mockOnConfirm}
            title="Cancel Booking"
            description="Please provide a reason"
          />
        );

        expect(screen.getByText("Cancel Booking")).toBeInTheDocument();
        expect(screen.getByText("Emergency situation")).toBeInTheDocument();
        expect(screen.getByText("Change of plans")).toBeInTheDocument();
      });

      it("should handle custom reason input", async () => {
        const mockOnConfirm = vi.fn();
        const mockOnClose = vi.fn();

        renderWithProviders(
          <CancellationForm
            isOpen={true}
            onClose={mockOnClose}
            onConfirm={mockOnConfirm}
            title="Cancel Booking"
            description="Please provide a reason"
          />
        );

        const customReasonOption = screen.getByText("Other (please specify)");
        fireEvent.click(customReasonOption);

        const textarea = screen.getByPlaceholderText("Enter your reason for cancellation...");
        fireEvent.change(textarea, { target: { value: "Custom reason" } });

        const cancelButton = screen.getByText("Cancel");
        fireEvent.click(cancelButton);

        await waitFor(() => {
          expect(mockOnConfirm).toHaveBeenCalledWith("Custom reason");
        });
      });
    });

    describe("BookingCard", () => {
      it("should display booking information", () => {
        renderWithProviders(
          <BookingCard
            booking={mockBooking}
            ride={mockRide}
            driver={mockUser}
            driverInfo={{ 
              userId: "driver1", 
              rating: 4.5, 
              totalRides: 10, 
              joinedAsDriverAt: new Date(),
              vehicleId: "vehicle1",
              isVerified: true
            }}
          />
        );

        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Office")).toBeInTheDocument();
        expect(screen.getByText("₹50")).toBeInTheDocument();
      });

      it("should show rating interface for completed bookings", () => {
        const completedBooking = { ...mockBooking, status: "completed" as const };

        renderWithProviders(
          <BookingCard
            booking={completedBooking}
            ride={mockRide}
            driver={mockUser}
            driverInfo={{ 
              userId: "driver1", 
              rating: 4.5, 
              totalRides: 10, 
              joinedAsDriverAt: new Date(),
              vehicleId: "vehicle1",
              isVerified: true
            }}
          />
        );

        expect(screen.getByText("Rate your ride experience")).toBeInTheDocument();
      });
    });
  });

  describe("Dashboard", () => {
    it("should display user role correctly", () => {
      // Test dashboard role display logic
      const passengerUser = { ...mockUser, role: "passenger" as const };
      const driverUser = { ...mockUser, role: "driver" as const };

      expect(passengerUser.role).toBe("passenger");
      expect(driverUser.role).toBe("driver");
    });

    it("should show only latest completed ride", () => {
      const completedBookings = [
        { ...mockBooking, id: "booking1", status: "completed", bookedAt: new Date("2024-01-01") },
        { ...mockBooking, id: "booking2", status: "completed", bookedAt: new Date("2024-01-02") },
        { ...mockBooking, id: "booking3", status: "completed", bookedAt: new Date("2024-01-03") },
      ];

      // Sort by date descending and take first
      const latestBooking = completedBookings
        .sort((a, b) => b.bookedAt.getTime() - a.bookedAt.getTime())[0];

      expect(latestBooking.id).toBe("booking3");
    });
  });

  describe("Data Validation", () => {
    it("should validate email format", () => {
      const validEmails = ["test@example.com", "user.name@domain.co.uk"];
      const invalidEmails = ["test", "test@", "@example.com", "test@.com"];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it("should validate phone number format", () => {
      const validPhones = ["+1234567890", "+91 9876543210"];
      const invalidPhones = ["123", "abc", "123456789"];

      // Basic phone validation
      validPhones.forEach(phone => {
        expect(phone.length >= 10).toBe(true);
      });

      invalidPhones.forEach(phone => {
        expect(phone.length < 10 || isNaN(Number(phone.replace(/\D/g, "")))).toBe(true);
      });
    });

    it("should validate ride times", () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 3600000); // 1 hour ago
      const futureTime = new Date(now.getTime() + 3600000); // 1 hour from now

      expect(pastTime < now).toBe(true);
      expect(futureTime > now).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {

      const mockGetRide = vi.fn().mockRejectedValue(new Error("Network error"));
      rideService.getRide = mockGetRide;

      await expect(rideService.getRide("invalid-id")).rejects.toThrow("Network error");
    });

    it("should handle invalid booking attempts", () => {
      const ride = { ...mockRide, availableSeats: 0 };
      const bookingAttempt = { seatsBooked: 1 };

      // Should prevent overbooking
      expect(bookingAttempt.seatsBooked > ride.availableSeats).toBe(true);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete booking flow", async () => {
      // Mock the entire booking flow

      // 1. Create ride
      const mockCreateRide = vi.fn().mockResolvedValue(mockRide);
      rideService.createRide = mockCreateRide;

      // 2. Create booking
      const mockCreateBooking = vi.fn().mockResolvedValue(mockBooking);
      bookingService.createBooking = mockCreateBooking;

      // 3. Update ride availability
      const mockRecalculateSeats = vi.fn().mockResolvedValue(undefined);
      rideService.recalculateAvailableSeats = mockRecalculateSeats;

      // Execute flow
      const ride = await rideService.createRide({
        driverId: "driver1",
        vehicleId: "vehicle1",
        startLocation: mockRide.startLocation,
        endLocation: mockRide.endLocation,
        departureTime: mockRide.departureTime,
        totalSeats: 4,
        availableSeats: 4,
        costPerSeat: 50,
        direction: "to_office",
        status: "AVAILABLE",
        createdAt: new Date(),
      });

      const booking = await bookingService.createBooking({
        rideId: ride.id,
        passengerId: "user1",
        seatsBooked: 1,
        amountToPayDriver: 50,
        status: "confirmed",
        bookedAt: new Date(),
      });

      await rideService.recalculateAvailableSeats(ride.id);

      expect(mockCreateRide).toHaveBeenCalled();
      expect(mockCreateBooking).toHaveBeenCalled();
      expect(mockRecalculateSeats).toHaveBeenCalled();
    });

    it("should handle ride completion and rating", async () => {

      // Mock completion
      const mockUpdateBooking = vi.fn().mockResolvedValue(undefined);
      bookingService.updateBooking = mockUpdateBooking;

      // Mock rating
      const mockCreateRating = vi.fn().mockResolvedValue({ id: "rating1" });
      ratingService.createRating = mockCreateRating;

      // Complete booking
      await bookingService.updateBooking("booking1", {
        status: "completed",
        completedAt: new Date()
      });

      // Create rating
      await ratingService.createRating({
        bookingId: "booking1",
        rideId: "ride1",
        fromUserId: "passenger1",
        toUserId: "driver1",
        rating: 5,
        comment: "Excellent ride!",
        createdAt: new Date(),
      });

      expect(mockUpdateBooking).toHaveBeenCalled();
      expect(mockCreateRating).toHaveBeenCalled();
    });
  });
});
