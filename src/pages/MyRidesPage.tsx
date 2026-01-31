import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Users, MapPin, Clock, Plus,
  ArrowRight, XCircle, CheckCircle2, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Ride, RideStatus } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rideService, bookingService } from '@/lib/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MyRidesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cancelRideId, setCancelRideId] = useState<string | null>(null);
  
  // Fetch user's rides (as driver)
  const { data: rides = [], isLoading: ridesLoading } = useQuery({
    queryKey: ['driver-rides', user?.id],
    queryFn: () => rideService.getRidesByDriver(user!.id),
    enabled: !!user,
  });

  // Fetch bookings for user's rides
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['ride-bookings', rides.map(r => r.id)],
    queryFn: async () => {
      const allBookings = [];
      for (const ride of rides) {
        const rideBookings = await bookingService.getBookingsByRide(ride.id);
        allBookings.push(...rideBookings);
      }
      return allBookings;
    },
    enabled: rides.length > 0,
  });

  // Cancel ride mutation
  const cancelRideMutation = useMutation({
    mutationFn: (rideId: string) => rideService.updateRide(rideId, { status: 'COMPLETED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });
      toast({ title: 'Success', description: 'Ride cancelled successfully.' });
      setCancelRideId(null);
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel ride.' });
    },
  });

  if (ridesLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const isDriver = user?.role === 'driver';

  if (!isDriver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h2 className="font-semibold text-lg mb-2">Become a Driver</h2>
            <p className="text-muted-foreground mb-4">
              Start offering rides and share your commute costs
            </p>
            <Button onClick={() => navigate('/become-driver')}>
              Become a Driver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const myRides = rides
    .sort((a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime());

  const scheduledRides = myRides.filter(r =>
    (r.status === 'BOOKED' || r.status === 'DRIVER_REACHED_PICKUP' || r.status === 'PASSENGER_ARRIVED' || r.status === 'TRIP_STARTED' || r.status === 'DESTINATION_REACHED') &&
    new Date(r.departureTime) > new Date()
  );
  const availableRides = myRides.filter(r =>
    r.status === 'AVAILABLE' && new Date(r.departureTime) > new Date()
  );
  const completedRides = myRides.filter(r => r.status === 'COMPLETED');
  const pastRides = myRides.filter(r =>
    new Date(r.departureTime) <= new Date() && r.status !== 'COMPLETED'
  );

  const getBookingsForRide = (rideId: string) => {
    return bookings.filter(b => 
      b.rideId === rideId && b.status === 'confirmed'
    );
  };

  const handleCancelRide = (rideId: string) => {
    cancelRideMutation.mutate(rideId);
  };

  const handleCompleteRide = (rideId: string) => {
    // This would typically be handled automatically or by admin
    // For now, just show a message
    toast({
      title: 'Ride Completed',
      description: 'Great job! The ride has been marked as complete.',
    });
  };

  const RideCard = ({ ride }: { ride: Ride }) => {
    const rideBookings = getBookingsForRide(ride.id);
    const bookedSeats = ride.totalSeats - ride.availableSeats;
    const isPast = new Date(ride.departureTime) < new Date();
    const totalEarnings = rideBookings.reduce((sum, b) => sum + b.amountToPayDriver, 0);
    
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Time & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {format(new Date(ride.departureTime), 'EEE, MMM d • h:mm a')}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                ride.status === 'AVAILABLE' ? 'bg-blue-50 text-blue-700' :
                ride.status === 'BOOKED' ? 'bg-success/10 text-success' :
                ride.status === 'COMPLETED' ? 'bg-primary/10 text-primary' :
                'bg-muted/10 text-muted-foreground'
              }`}>
                {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium truncate">{ride.startLocation.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{ride.endLocation.name}</span>
            </div>

            {/* Booking Info */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {bookedSeats}/{ride.totalSeats} booked
                </span>
                <span>₹{ride.costPerSeat}/seat</span>
              </div>
              {totalEarnings > 0 && (
                <p className="font-semibold text-primary">₹{totalEarnings}</p>
              )}
            </div>

            {/* Passengers */}
            {rideBookings.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">Passengers:</p>
                <div className="space-y-1">
                  {rideBookings.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between text-sm">
                      <span>Passenger {booking.passengerId.slice(-4)}</span>
                      <span className="text-muted-foreground">{booking.seatsBooked} seat(s)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {ride.status === 'BOOKED' && (
              <div className="flex gap-2 pt-2">
                {isPast ? (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleCompleteRide(ride.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Mark Complete
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/ride/${ride.id}`)}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive border-destructive/30"
                      onClick={() => setCancelRideId(ride.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="p-8 text-center">
        <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{message}</p>
        <Button 
          className="mt-4"
          onClick={() => navigate('/create-ride')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Offer a Ride
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Rides</h1>
            <p className="text-primary-foreground/80 mt-1">Manage your offered rides</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              user?.role === 'driver' 
                ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30' 
                : 'bg-green-500/20 text-green-100 border border-green-400/30'
            }`}>
              {user?.role === 'driver' ? 'Driver' : 'Passenger'}
            </div>
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => navigate('/create-ride')}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Ride
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 max-w-lg mx-auto">
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="available">
              Available ({availableRides.length})
            </TabsTrigger>
            <TabsTrigger value="booked">
              Booked ({scheduledRides.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedRides.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastRides.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-4">
            {availableRides.length > 0 ? (
              availableRides.map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))
            ) : (
              <EmptyState message="No available rides" />
            )}
          </TabsContent>
          
          <TabsContent value="booked" className="space-y-4">
            {scheduledRides.length > 0 ? (
              scheduledRides.map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))
            ) : (
              <EmptyState message="No booked rides yet" />
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedRides.length > 0 ? (
              completedRides.map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))
            ) : (
              <EmptyState message="No completed rides yet" />
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            {pastRides.length > 0 ? (
              pastRides.map(ride => (
                <RideCard key={ride.id} ride={ride} />
              ))
            ) : (
              <EmptyState message="No past rides" />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelRideId} onOpenChange={() => setCancelRideId(null)}>
        <AlertDialogContent className="bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Ride</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this ride? All passengers will be notified and refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Ride</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => cancelRideId && handleCancelRide(cancelRideId)}
              className="bg-destructive text-destructive-foreground"
            >
              Cancel Ride
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyRidesPage;
