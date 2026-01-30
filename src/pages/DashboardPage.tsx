import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { rideService, bookingService } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ArrowRight, Users, Car, Calendar, Search, Plus, ChevronRight } from 'lucide-react';
import { Ride } from '@/types';
import { BookingCard } from '@/components/BookingCard';

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

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isDriver = user?.role === 'driver';

  // Fetch upcoming rides (available for booking)
  const { data: upcomingRides = [], isLoading: ridesLoading } = useQuery({
    queryKey: ['upcoming-rides'],
    queryFn: async () => {
      if (!user) return [];
      const rides = await rideService.getAvailableRides();
      return rides.filter(ride =>
        ride.status === 'scheduled' &&
        new Date(getDateFromTimestamp(ride.departureTime)) > new Date() &&
        ride.availableSeats > 0 &&
        ride.driverId !== user.id
      ).slice(0, 3);
    },
    enabled: !!user && !isDriver,
  });

  // Fetch user's upcoming bookings
  const { data: userBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const bookings = await bookingService.getBookingsByPassenger(user.id);
      const confirmedBookings = bookings.filter(booking =>
        booking.status === 'confirmed'
      ).slice(0, 3);

      // Fetch ride data for each booking
      const bookingsWithRides = await Promise.all(
        confirmedBookings.map(async (booking) => {
          try {
            const ride = await rideService.getRide(booking.rideId);
            return { booking, ride };
          } catch (error) {
            console.error('Error fetching ride for booking:', booking.id, error);
            return null;
          }
        })
      );

      return bookingsWithRides.filter(Boolean);
    },
    enabled: !!user,
  });

  // Fetch driver's active rides
  const { data: driverRides = [], isLoading: driverRidesLoading } = useQuery({
    queryKey: ['driver-rides', user?.id],
    queryFn: async () => {
      if (!user || !isDriver) return [];
      const rides = await rideService.getRidesByDriver(user.id);
      return rides.filter(ride =>
        ride.status === 'scheduled' &&
        new Date(getDateFromTimestamp(ride.departureTime)) > new Date()
      ).slice(0, 3);
    },
    enabled: !!user && isDriver,
  });

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
          <h1 className="text-xl md:text-2xl font-bold">Hello, {getFirstName()} 👋</h1>
          <p className="text-primary-foreground/80 mt-1 md:mt-2 text-sm md:text-base">Where do you want to go today?</p>

          {/* Quick Stats */}
          <div className="flex gap-3 md:gap-4 mt-4 md:mt-6">
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm opacity-80">
                  {isDriver ? 'Your Rides' : 'Available'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold mt-1">
                {isDriver ? (driverRidesLoading ? '...' : driverRides.length) : (ridesLoading ? '...' : upcomingRides.length)}
              </p>
            </div>
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm opacity-80">Bookings</span>
              </div>
              <p className="text-xl md:text-2xl font-bold mt-1">
                {bookingsLoading ? '...' : userBookings.length}
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

        {/* Your Upcoming Bookings */}
        {!bookingsLoading && userBookings.length > 0 && (
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
              {userBookings.map((item) => (
                <BookingCard
                  key={item.booking.id}
                  booking={item.booking}
                  ride={item.ride}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Rides */}
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
          ) : upcomingRides.length > 0 ? (
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

        {/* Driver Section */}
        {isDriver && driverRides.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-lg font-semibold">Your Offered Rides</h2>
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
              {driverRides.map(ride => (
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
                        <span className="text-xs md:text-sm font-medium">
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
      </div>
    </div>
  );
};

export default DashboardPage;
