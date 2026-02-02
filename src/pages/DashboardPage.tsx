import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { rideService, bookingService, userService, driverService } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn, shouldAutoCompleteRide } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ArrowRight, Users, Car, Calendar, Search, Plus, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Ride, Booking, User, Driver } from '@/types';
import { BookingCard } from '@/components/BookingCard';

// Type for user bookings data
type UserBookingsData = {
  upcoming: { booking: Booking; ride: Ride; driver?: User; driverInfo?: Driver }[];
  completed: { booking: Booking; ride: Ride; driver?: User; driverInfo?: Driver }[];
};

// Type for today's ride data
type TodaysRideData = Ride | { ride: Ride; booking: Booking } | null;

// Helper function to handle timestamp conversion
const getDateFromTimestamp = (timestamp: Date | string | { toDate: () => Date }): Date => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return timestamp as Date;
};

// RideCard component to handle individual ride display
const RideCard = ({ ride, onClick }: { ride: Ride; onClick: () => void }) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">
                {format(getDateFromTimestamp(ride.departureTime), 'EEE, MMM d • h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span className="font-medium text-sm md:text-base truncate">{ride.startLocation.name}</span>
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm md:text-base truncate">{ride.endLocation.name}</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                {ride.availableSeats} seats
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right ml-2">
            <p className="text-lg md:text-xl font-bold text-primary">₹{ride.costPerSeat}</p>
            <p className="text-xs text-muted-foreground">per seat</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Ride Execution Components
const TodaysRideCard = ({ ride, booking, isDriver }: { ride: Ride; booking?: Booking; isDriver: boolean }) => {
  const getStatusMessage = () => {
    switch (ride.status) {
      case 'AVAILABLE':
        return 'Your ride is available for booking. Waiting for passengers.';
      case 'BOOKED':
        return isDriver
          ? 'Your ride is booked. Please reach the pickup location by departure time.'
          : 'Your ride is booked. Please be ready at the pickup location.';
      case 'COMPLETED':
        return 'Ride completed successfully!';
      case 'EXPIRED':
        return 'This ride has expired.';
      default:
        return 'Ride in progress';
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">
              {isDriver ? "Today's Ride" : "Your Ride Today"}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{ride.startLocation.name}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span>{ride.endLocation.name}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(getDateFromTimestamp(ride.departureTime), 'h:mm a')}</span>
            {ride.estimatedArrivalTime && (
              <>
                <ArrowRight className="h-4 w-4" />
                <span>ETA: {format(getDateFromTimestamp(ride.estimatedArrivalTime), 'h:mm a')}</span>
              </>
            )}
          </div>

          <p className="text-sm font-medium">{getStatusMessage()}</p>

          {ride.status === 'BOOKED' && ride.estimatedArrivalTime && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Estimated arrival: {format(getDateFromTimestamp(ride.estimatedArrivalTime), 'h:mm a')}
              </p>
            </div>
          )}

          {ride.status === 'COMPLETED' && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✅ Ride completed successfully!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isDriver = user?.role === 'driver';

  // Check for expired rides periodically
  useEffect(() => {
    const checkExpiredRides = async () => {
      try {
        console.log('⏰ DashboardPage: Running periodic expired rides check...');
        await rideService.updateExpiredRides();
        // Invalidate relevant queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['upcoming-rides'] });
        queryClient.invalidateQueries({ queryKey: ['available-rides'] });
        queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
        queryClient.invalidateQueries({ queryKey: ['driver-available-rides'] });
      } catch (error) {
        console.error('❌ DashboardPage: Error checking expired rides:', error);
      }
    };

    // Check immediately on mount
    checkExpiredRides();

    // Set up interval to check every 5 minutes
    const interval = setInterval(checkExpiredRides, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Auto-complete rides based on ETA
  useEffect(() => {
    const autoCompleteRides = async () => {
      try {
        console.log('🚗 DashboardPage: Checking for rides to auto-complete...');

        // Get today's ride for the current user
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (isDriver) {
          // For drivers: check if they have a booked ride today that should be auto-completed
          const rides = await rideService.getRidesByDriver(user.id);
          const todaysRides = rides.filter(ride => {
            const rideDate = getDateFromTimestamp(ride.departureTime);
            return rideDate >= today && rideDate < tomorrow && ride.status === 'BOOKED';
          });

          for (const ride of todaysRides) {
            if (shouldAutoCompleteRide(ride.departureTime, ride.estimatedArrivalTime)) {
              console.log(`✅ DashboardPage: Auto-completing ride ${ride.id}`);
              await rideService.arrivedAtDestination(ride.id);
              await rideService.paymentCollected(ride.id);
              queryClient.invalidateQueries({ queryKey: ['todays-ride'] });
            }
          }
        } else {
          // For passengers: check if they have bookings that should be auto-completed
          const bookings = await bookingService.getBookingsByPassenger(user.id);
          const todaysBookings = bookings.filter(booking => booking.status === 'confirmed');

          for (const booking of todaysBookings) {
            try {
              const ride = await rideService.getRide(booking.rideId);
              if (ride && shouldAutoCompleteRide(ride.departureTime, ride.estimatedArrivalTime)) {
                console.log(`✅ DashboardPage: Auto-completing booking ${booking.id} for ride ${ride.id}`);
                // Mark booking as completed
                await bookingService.updateBooking(booking.id, { status: 'completed' });
                queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
              }
            } catch (error) {
              console.error('Error auto-completing booking:', booking.id, error);
            }
          }
        }
      } catch (error) {
        console.error('❌ DashboardPage: Error auto-completing rides:', error);
      }
    };

    // Check immediately and then every minute
    autoCompleteRides();
    const interval = setInterval(autoCompleteRides, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [user, isDriver, queryClient]);

  // Fetch upcoming rides (available for booking)
  const { data: upcomingRidesData, isLoading: ridesLoading } = useQuery({
    queryKey: ['upcoming-rides'],
    queryFn: async () => {
      console.log('🔍 DashboardPage: Starting to fetch upcoming rides...');
      console.log('👤 DashboardPage: Current user ID:', user?.id);
      console.log('🎭 DashboardPage: Current user role:', user?.role);
      console.log('🚗 DashboardPage: Is driver:', isDriver);
      
      if (!user) {
        console.log('❌ DashboardPage: No user, returning empty');
        return [];
      }
      
      const rides = await rideService.getAvailableRides();
      console.log('📊 DashboardPage: Raw rides from server:', rides);
      
      const filteredRides = rides.filter(ride => {
        console.log('🔍 DashboardPage: Filtering ride:', {
          id: ride.id,
          status: ride.status,
          direction: ride.direction,
          departureTime: ride.departureTime,
          driverId: ride.driverId,
          availableSeats: ride.availableSeats
        });
        
        const statusCheck = ride.status === 'AVAILABLE';
        const timeCheck = new Date(getDateFromTimestamp(ride.departureTime)) > new Date();
        const seatsCheck = ride.availableSeats > 0;
        const driverCheck = ride.driverId !== user.id;
        
        console.log('📋 DashboardPage: Filter checks:', {
          statusCheck,
          timeCheck,
          seatsCheck,
          driverCheck
        });
        
        const passes = statusCheck && timeCheck && seatsCheck && driverCheck;
        console.log('✅ DashboardPage: Ride passes filters:', passes);
        
        return passes;
      });
      
      console.log('✅ DashboardPage: Final upcomingRides:', filteredRides);
      return filteredRides.slice(0, 3);
    },
    enabled: !!user && !isDriver,
  });

  const upcomingRides = Array.isArray(upcomingRidesData) ? upcomingRidesData : [];

  // Fetch user's bookings (upcoming and completed)
  const { data, isLoading: bookingsLoading } = useQuery<UserBookingsData>({
    queryKey: ['user-bookings', user?.id],
    queryFn: async (): Promise<UserBookingsData> => {
      if (!user) return { upcoming: [], completed: [] };
      console.log('🔍 DashboardPage: Fetching user bookings for:', user.id);
      const bookings = Array.isArray(await bookingService.getBookingsByPassenger(user.id)) 
        ? await bookingService.getBookingsByPassenger(user.id) 
        : [];
      console.log('📊 DashboardPage: Raw bookings from server:', bookings);
      const confirmedBookings = bookings.filter(booking =>
        booking.status === 'confirmed'
      ).slice(0, 3);
      const completedBookings = bookings.filter(booking =>
        booking.status === 'completed'
      ).slice(0, 3);
      console.log('✅ DashboardPage: Confirmed bookings:', confirmedBookings);

      // Fetch ride data for confirmed bookings
      const confirmedBookingsWithRides = await Promise.all(
        confirmedBookings.map(async (booking) => {
          try {
            console.log('🔍 DashboardPage: Fetching ride for confirmed booking:', booking.id, 'rideId:', booking.rideId);
            const ride = await rideService.getRide(booking.rideId);
            console.log('✅ DashboardPage: Got ride for confirmed booking:', booking.id, 'ride:', ride);
            
            // Fetch driver information
            let driver: User | undefined;
            let driverInfo: Driver | undefined;
            if (ride) {
              try {
                driver = await userService.getUser(ride.driverId);
                driverInfo = await driverService.getDriver(ride.driverId);
              } catch (error) {
                console.error('❌ DashboardPage: Error fetching driver for booking:', booking.id, error);
              }
            }
            
            return { booking, ride, driver, driverInfo };
          } catch (error) {
            console.error('❌ DashboardPage: Error fetching ride for confirmed booking:', booking.id, error);
            return null;
          }
        })
      );

      // Fetch ride data for completed bookings
      const completedBookingsWithRides = await Promise.all(
        completedBookings.map(async (booking) => {
          try {
            console.log('🔍 DashboardPage: Fetching ride for completed booking:', booking.id, 'rideId:', booking.rideId);
            const ride = await rideService.getRide(booking.rideId);
            console.log('✅ DashboardPage: Got ride for completed booking:', booking.id, 'ride:', ride);
            
            // Fetch driver information
            let driver: User | undefined;
            let driverInfo: Driver | undefined;
            if (ride) {
              try {
                driver = await userService.getUser(ride.driverId);
                driverInfo = await driverService.getDriver(ride.driverId);
              } catch (error) {
                console.error('❌ DashboardPage: Error fetching driver for booking:', booking.id, error);
              }
            }
            
            return { booking, ride, driver, driverInfo };
          } catch (error) {
            console.error('❌ DashboardPage: Error fetching ride for completed booking:', booking.id, error);
            return null;
          }
        })
      );

      const confirmedFiltered = Array.isArray(confirmedBookingsWithRides) ? confirmedBookingsWithRides.filter(Boolean) : [];
      const completedFiltered = Array.isArray(completedBookingsWithRides) ? completedBookingsWithRides.filter(Boolean) : [];
      console.log('🎯 DashboardPage: Final confirmed bookings:', confirmedFiltered);
      console.log('🎯 DashboardPage: Final completed bookings:', completedFiltered);

      return {
        upcoming: confirmedFiltered,
        completed: completedFiltered
      } as UserBookingsData;
    },
    enabled: !!user,
  });

  const userBookingsData = data ?? { upcoming: [], completed: [] };

  // Fetch driver's active rides
  const { data: driverRidesData, isLoading: driverRidesLoading } = useQuery({
    queryKey: ['driver-rides', user?.id],
    queryFn: async () => {
      if (!user || !isDriver) return [];
      const rides = Array.isArray(await rideService.getRidesByDriver(user.id)) 
        ? await rideService.getRidesByDriver(user.id) 
        : [];
      return rides.filter(ride =>
        new Date(getDateFromTimestamp(ride.departureTime)) > new Date()
      ).slice(0, 3);
    },
    enabled: !!user && isDriver,
  });

  const driverRides = Array.isArray(driverRidesData) ? driverRidesData : [];

  // Fetch driver's available rides (for stats)
  const { data: driverAvailableRidesData, isLoading: driverAvailableLoading } = useQuery({
    queryKey: ['driver-available-rides', user?.id],
    queryFn: async () => {
      if (!user || !isDriver) return [];
      const rides = Array.isArray(await rideService.getRidesByDriver(user.id)) 
        ? await rideService.getRidesByDriver(user.id) 
        : [];
      return rides.filter(ride =>
        new Date(getDateFromTimestamp(ride.departureTime)) > new Date() &&
        ride.status === 'AVAILABLE'
      );
    },
    enabled: !!user && isDriver,
  });

  const driverAvailableRides = Array.isArray(driverAvailableRidesData) ? driverAvailableRidesData : [];

  // Fetch driver's booked rides (for stats)
  const { data: driverBookedRidesData, isLoading: driverBookedLoading } = useQuery({
    queryKey: ['driver-booked-rides', user?.id],
    queryFn: async () => {
      if (!user || !isDriver) return [];
      const rides = Array.isArray(await rideService.getRidesByDriver(user.id)) 
        ? await rideService.getRidesByDriver(user.id) 
        : [];
      return rides.filter(ride =>
        new Date(getDateFromTimestamp(ride.departureTime)) > new Date() &&
        ride.status === 'BOOKED'
      );
    },
    enabled: !!user && isDriver,
  });

  const driverBookedRides = Array.isArray(driverBookedRidesData) ? driverBookedRidesData : [];

  // Fetch driver's completed rides (for showing when no active rides)
  const { data: driverCompletedRidesData, isLoading: driverCompletedLoading } = useQuery({
    queryKey: ['driver-completed-rides', user?.id],
    queryFn: async () => {
      if (!user || !isDriver) return [];
      const rides = Array.isArray(await rideService.getRidesByDriver(user.id)) 
        ? await rideService.getRidesByDriver(user.id) 
        : [];
      return rides.filter(ride =>
        ride.status === 'COMPLETED'
      ).sort((a, b) => new Date(getDateFromTimestamp(b.departureTime)).getTime() - new Date(getDateFromTimestamp(a.departureTime)).getTime())
      .slice(0, 3);
    },
    enabled: !!user && isDriver,
  });

  const driverCompletedRides = Array.isArray(driverCompletedRidesData) ? driverCompletedRidesData : [];
  const { data: todaysRideData, isLoading: todaysRideLoading } = useQuery<TodaysRideData>({
    queryKey: ['todays-ride', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (isDriver) {
        // For drivers: check if they have a booked ride today
        const rides = Array.isArray(await rideService.getRidesByDriver(user.id)) 
          ? await rideService.getRidesByDriver(user.id) 
          : [];
        const todaysRides = rides.filter(ride => {
          const rideDate = new Date(getDateFromTimestamp(ride.departureTime));
          return rideDate >= today && rideDate < tomorrow && ride.status === 'BOOKED';
        });
        return todaysRides[0] || null; // Return the first booked ride
      } else {
        // For passengers: check if they have a confirmed booking for today
        const bookings = Array.isArray(await bookingService.getBookingsByPassenger(user.id)) 
          ? await bookingService.getBookingsByPassenger(user.id) 
          : [];
        const todaysBookings = bookings.filter(booking => booking.status === 'confirmed');

        for (const booking of todaysBookings) {
          try {
            const ride = await rideService.getRide(booking.rideId);
            if (ride) {
              const rideDate = new Date(getDateFromTimestamp(ride.departureTime));
              if (rideDate >= today && rideDate < tomorrow && ride.status === 'BOOKED') {
                return { ride, booking };
              }
            }
          } catch (error) {
            console.error('Error fetching ride for booking:', booking.id, error);
          }
        }
        return null;
      }
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const todaysRide = todaysRideData ?? null;

  const getGreeting = () => {
    return 'Welcome back';
  };

  const getFirstName = () => {
    const fullName = user?.name || 'User';
    return fullName.split(' ')[0];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-6 md:pt-8 pb-10 md:pb-12 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Hello, {getFirstName()} 👋</h1>
              <p className="text-primary-foreground/80 mt-1 md:mt-2 text-sm md:text-base">Where do you want to go today?</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isDriver 
                ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30' 
                : 'bg-green-500/20 text-green-100 border border-green-400/30'
            }`}>
              {isDriver ? 'Driver' : 'Passenger'}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-3 md:gap-4 mt-4 md:mt-6">
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm opacity-80">
                  {isDriver ? 'Available' : 'Available'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold mt-1">
                {isDriver ? (driverAvailableLoading ? '...' : driverAvailableRides?.length || 0) : (ridesLoading ? '...' : upcomingRides?.length || 0)}
              </p>
            </div>
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm opacity-80">
                  {isDriver ? 'Booked' : 'Bookings'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold mt-1">
                {isDriver ? (driverBookedLoading ? '...' : driverBookedRides?.length || 0) : (bookingsLoading ? '...' : (userBookingsData?.upcoming?.length || 0) + (userBookingsData?.completed?.length || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 md:-mt-6 max-w-lg mx-auto space-y-4 md:space-y-6 pb-6">
        {/* Quick Actions */}
        <Card className="shadow-lg">
          <CardContent className="p-3 md:p-4">
            <div className="flex gap-2 md:gap-3">
              <Button
                className="flex-1 h-auto p-3 md:p-4 bg-white border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                onClick={() => navigate('/find-rides')}
              >
                <div className="flex items-center justify-center md:justify-between w-full">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full">
                      <Search className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div className="text-left hidden md:block">
                      <div className="text-sm font-semibold text-gray-900">Find a ride</div>
                      <div className="text-xs text-gray-600">To Office / Home...</div>
                    </div>
                    <div className="text-center md:hidden">
                      <div className="text-sm font-semibold text-gray-900">Find Ride</div>
                    </div>
                  </div>
                  <div className="hidden md:flex md:flex-col md:items-end md:gap-1">
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">Today</span>
                    </div>
                  </div>
                </div>
              </Button>
              {isDriver ? (
                <Button 
                  variant="outline"
                  className="flex-1 h-auto p-3 md:p-4"
                  onClick={() => navigate('/create-ride')}
                >
                  <div className="flex flex-col items-center gap-1 md:gap-2">
                    <Plus className="h-5 w-5 md:h-6 md:w-6" />
                    <span className="text-sm md:text-base">Offer Ride</span>
                  </div>
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  className="flex-1 h-auto p-3 md:p-4"
                  onClick={() => navigate('/become-driver')}
                >
                  <div className="flex flex-col items-center gap-1 md:gap-2">
                    <Car className="h-5 w-5 md:h-6 md:w-6" />
                    <span className="text-sm md:text-base">Become Driver</span>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Ride Execution Card */}
        {todaysRide && !todaysRideLoading && (
          <TodaysRideCard
            ride={isDriver ? todaysRide as Ride : (todaysRide as { ride: Ride; booking: Booking }).ride}
            booking={!isDriver ? (todaysRide as { ride: Ride; booking: Booking }).booking : undefined}
            isDriver={isDriver}
          />
        )}

        {/* Your Upcoming Bookings */}
        {!bookingsLoading && (userBookingsData?.upcoming?.length || 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-lg font-semibold">Your Upcoming Rides</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate('/my-bookings')}
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {userBookingsData?.upcoming
                ?.filter(item => item && item.booking && item.ride)
                .map((item) => (
                <BookingCard
                  key={item.booking.id}
                  booking={item.booking}
                  ride={item.ride}
                  driver={item.driver}
                  driverInfo={item.driverInfo}
                />
              ))}
            </div>
          </section>
        )}

        {/* Your Completed Rides */}
        {!bookingsLoading && (userBookingsData?.completed?.length || 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-lg font-semibold">Your Completed Rides</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate('/my-bookings')}
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {userBookingsData?.completed
                ?.filter(item => item && item.booking && item.ride)
                .sort((a, b) => new Date(b.booking.bookedAt).getTime() - new Date(a.booking.bookedAt).getTime())
                .slice(0, 1)
                .map((item) => (
                <BookingCard
                  key={item.booking.id}
                  booking={item.booking}
                  ride={item.ride}
                  driver={item.driver}
                  driverInfo={item.driverInfo}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Rides (for passengers only) */}
        {!isDriver && (
          <section>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-lg font-semibold">Available Rides</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => navigate('/find-rides')}
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            {ridesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-3 md:p-4">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingRides?.length > 0 ? (
              <div className="space-y-3">
                {upcomingRides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} onClick={() => navigate(`/ride/${ride.id}`)} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No rides available right now</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => navigate('/find-rides')}
                  >
                    Check back later
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Driver Available Rides */}
        {isDriver && (driverAvailableRides?.length || 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-lg font-semibold">Available Rides</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate('/my-rides')}
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {driverAvailableRides.slice(0, 2).map(ride => (
                <Card
                  key={ride.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/ride/${ride.id}`)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          {format(getDateFromTimestamp(ride.departureTime), 'EEE, MMM d • h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm md:text-base truncate">{ride.startLocation.name}</span>
                          <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm md:text-base truncate">{ride.endLocation.name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-right ml-2">
                        <span className="text-xs md:text-sm font-medium text-green-600">
                          {ride.availableSeats} seats available
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Driver Booked Rides */}
        {isDriver && (driverBookedRides?.length || 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-lg font-semibold">Booked Rides</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate('/my-rides')}
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {driverBookedRides.slice(0, 2).map(ride => (
                <Card
                  key={ride.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/ride/${ride.id}`)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          {format(getDateFromTimestamp(ride.departureTime), 'EEE, MMM d • h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm md:text-base truncate">{ride.startLocation.name}</span>
                          <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm md:text-base truncate">{ride.endLocation.name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-right ml-2">
                        <span className="text-xs md:text-sm font-medium text-blue-600">
                          {ride.totalSeats - ride.availableSeats}/{ride.totalSeats} booked
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Driver Completed Rides (shown when no active rides) */}
        {isDriver && (driverAvailableRides?.length || 0) === 0 && (driverBookedRides?.length || 0) === 0 && (driverCompletedRides?.length || 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-lg font-semibold">Your Completed Rides</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => navigate('/my-rides')}
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {driverCompletedRides.slice(0, 2).map(ride => (
                <Card
                  key={ride.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/ride/${ride.id}`)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          {format(getDateFromTimestamp(ride.departureTime), 'EEE, MMM d • h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm md:text-base truncate">{ride.startLocation.name}</span>
                          <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm md:text-base truncate">{ride.endLocation.name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-right ml-2">
                        <span className="text-xs md:text-sm font-medium text-green-600">
                          Completed
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ride.totalSeats - ride.availableSeats} passengers
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
