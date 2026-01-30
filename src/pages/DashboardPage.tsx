import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Users, MapPin, Clock, ArrowRight, 
  ChevronRight, Star, TrendingUp, Hand, Calendar, Search, Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getRides, getBookings, getUsers, getDrivers, getVehicles } from '@/lib/storage';
import { format } from 'date-fns';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const rides = getRides();
  const bookings = getBookings();
  const users = getUsers();
  const drivers = getDrivers();
  const vehicles = getVehicles();
  
  const isDriver = user?.role === 'driver';

  // Get upcoming rides (available for booking)
  const upcomingRides = Object.values(rides)
    .filter(ride => 
      ride.status === 'scheduled' && 
      new Date(ride.departureTime) > new Date() &&
      ride.availableSeats > 0 &&
      ride.driverId !== user?.id
    )
    .slice(0, 3);

  // Get user's upcoming bookings
  const userBookings = Object.values(bookings)
    .filter(booking => 
      booking.passengerId === user?.id && 
      booking.status === 'confirmed'
    )
    .slice(0, 3);

  // Get driver's active rides
  const driverRides = isDriver 
    ? Object.values(rides)
        .filter(ride => 
          ride.driverId === user?.id && 
          ride.status === 'scheduled' &&
          new Date(ride.departureTime) > new Date()
        )
        .slice(0, 3)
    : [];

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
                {isDriver ? driverRides.length : upcomingRides.length}
              </p>
            </div>
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm opacity-80">Bookings</span>
              </div>
              <p className="text-xl md:text-2xl font-bold mt-1">{userBookings.length}</p>
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
                className="flex-1 h-auto p-2 md:p-4 bg-white border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                onClick={() => navigate('/find-rides')}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1 md:gap-3">
                    <div className="flex items-center justify-center w-6 h-6 md:w-10 md:h-10 bg-primary/10 rounded-full">
                      <Search className="h-3 w-3 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] md:text-sm font-semibold text-gray-900">Find a ride</div>
                      <div className="text-[8px] md:text-xs text-gray-600 hidden md:block">To Office / Home...</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 hidden md:flex">
                    <div className="flex items-center gap-1 bg-primary/10 px-1 md:px-2 py-0.5 md:py-1 rounded-full">
                      <Calendar className="h-2 w-2 md:h-3 md:w-3 text-primary" />
                      <span className="text-[8px] md:text-xs font-medium text-primary">Today</span>
                    </div>
                  </div>
                </div>
              </Button>
              {isDriver ? (
                <Button 
                  variant="outline"
                  className="flex-1 h-auto py-2 md:py-4 flex-col gap-0.5 md:gap-2"
                  onClick={() => navigate('/create-ride')}
                >
                  <Plus className="h-4 w-4 md:h-6 md:w-6" />
                  <span className="text-[10px] md:text-sm">Offer a Ride</span>
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  className="flex-1 h-auto py-2 md:py-4 flex-col gap-0.5 md:gap-2"
                  onClick={() => navigate('/become-driver')}
                >
                  <Car className="h-4 w-4 md:h-6 md:w-6" />
                  <span className="text-[10px] md:text-sm">Become Driver</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Your Upcoming Bookings */}
        {userBookings.length > 0 && (
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
              {userBookings.map(booking => {
                const ride = rides[booking.rideId];
                if (!ride) return null;
                const driver = users[ride.driverId];
                
                return (
                  <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                            {format(new Date(ride.departureTime), 'EEE, MMM d • h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                            <span className="font-medium text-sm md:text-base truncate">{ride.startLocation.name}</span>
                            <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm md:text-base truncate">{ride.endLocation.name}</span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            with {driver?.name || 'Driver'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end text-right ml-2">
                          <p className="text-lg font-bold text-primary">₹{booking.totalCost}</p>
                          <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full mt-1">
                            Confirmed
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
          
          {upcomingRides.length > 0 ? (
            <div className="space-y-3">
              {upcomingRides.map(ride => {
                const driver = users[ride.driverId];
                const driverInfo = drivers[ride.driverId];
                const vehicle = vehicles[ride.vehicleId];
                
                return (
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
                            <span className="truncate">
                              {format(new Date(ride.departureTime), 'EEE, MMM d • h:mm a')}
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
                            {driverInfo && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 md:h-4 md:w-4 fill-warning text-warning flex-shrink-0" />
                                {driverInfo.rating.toFixed(1)}
                              </span>
                            )}
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
              })}
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
                          {format(new Date(ride.departureTime), 'EEE, MMM d • h:mm a')}
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
