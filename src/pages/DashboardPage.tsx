import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Users, MapPin, Clock, ArrowRight, 
  ChevronRight, Star, TrendingUp 
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
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-8 pb-12 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <p className="text-primary-foreground/80">{getGreeting()}</p>
          <h1 className="text-2xl font-bold mt-1">{user?.name || 'User'}</h1>
          
          {/* Quick Stats */}
          <div className="flex gap-4 mt-6">
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                <span className="text-sm opacity-80">
                  {isDriver ? 'Your Rides' : 'Available'}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {isDriver ? driverRides.length : upcomingRides.length}
              </p>
            </div>
            <div className="flex-1 bg-primary-foreground/10 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm opacity-80">Bookings</span>
              </div>
              <p className="text-2xl font-bold mt-1">{userBookings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-6 max-w-lg mx-auto space-y-6 pb-6">
        {/* Quick Actions */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Button 
                className="flex-1 h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/find-rides')}
              >
                <Search className="h-6 w-6" />
                <span className="text-sm">Find a Ride</span>
              </Button>
              {isDriver ? (
                <Button 
                  variant="outline"
                  className="flex-1 h-auto py-4 flex-col gap-2"
                  onClick={() => navigate('/create-ride')}
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-sm">Offer a Ride</span>
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  className="flex-1 h-auto py-4 flex-col gap-2"
                  onClick={() => navigate('/become-driver')}
                >
                  <Car className="h-6 w-6" />
                  <span className="text-sm">Become Driver</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Your Upcoming Bookings */}
        {userBookings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Your Upcoming Rides</h2>
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
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {format(new Date(ride.departureTime), 'EEE, MMM d • h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{ride.startLocation.name}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{ride.endLocation.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            with {driver?.name || 'Driver'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">₹{booking.totalCost}</p>
                          <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full">
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Available Rides</h2>
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
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {format(new Date(ride.departureTime), 'EEE, MMM d • h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{ride.startLocation.name}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{ride.endLocation.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {ride.availableSeats} seats
                            </span>
                            {driverInfo && (
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-warning text-warning" />
                                {driverInfo.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">₹{ride.costPerSeat}</p>
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Your Offered Rides</h2>
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
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(ride.departureTime), 'EEE, MMM d • h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">{ride.startLocation.name}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{ride.endLocation.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
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

// Import missing icons
import { Calendar, Search, Plus } from 'lucide-react';

export default DashboardPage;
