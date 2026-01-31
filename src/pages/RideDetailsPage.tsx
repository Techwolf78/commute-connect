import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, Users, Star, 
  Car, User, Phone,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Booking } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rideService, userService, driverService, vehicleService, bookingService } from '@/lib/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const RideDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [seatsToBook, setSeatsToBook] = useState('1');
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Fetch ride details
  const { data: ride, isLoading: rideLoading } = useQuery({
    queryKey: ['ride', id],
    queryFn: () => rideService.getRide(id!),
    enabled: !!id,
  });

  // Fetch driver info
  const { data: driver, isLoading: driverLoading } = useQuery({
    queryKey: ['user', ride?.driverId],
    queryFn: () => userService.getUser(ride!.driverId),
    enabled: !!ride?.driverId,
  });

  // Fetch driver profile
  const { data: driverInfo, isLoading: driverInfoLoading } = useQuery({
    queryKey: ['driver', ride?.driverId],
    queryFn: () => driverService.getDriver(ride!.driverId),
    enabled: !!ride?.driverId,
  });

  // Fetch vehicle info
  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ['vehicle', driverInfo?.vehicleId],
    queryFn: () => vehicleService.getVehicle(driverInfo!.vehicleId),
    enabled: !!driverInfo?.vehicleId,
  });

  // Fetch existing bookings for this ride
  const { data: existingBookings = [] } = useQuery({
    queryKey: ['ride-bookings', id],
    queryFn: () => bookingService.getBookingsByRide(id!),
    enabled: !!id,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: Omit<Booking, 'id'>) => {
      // First create the booking
      const booking = await bookingService.createBooking(bookingData);
      // Then update the ride status to BOOKED and decrement availableSeats
      await rideService.updateRide(ride.id, { 
        status: 'BOOKED',
        availableSeats: ride.availableSeats - bookingData.seatsBooked
      });
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-rides'] });
      queryClient.invalidateQueries({ queryKey: ['todays-ride'] });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      setShowSuccess(true);
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to book ride.' });
    },
    onSettled: () => {
      setIsBooking(false);
    },
  });

  if (rideLoading || driverLoading || driverInfoLoading || vehicleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Ride not found</p>
          <Button onClick={() => navigate('/find-rides')}>Find Rides</Button>
        </div>
      </div>
    );
  }

  const isOwnRide = ride.driverId === user?.id;
  const totalCost = parseInt(seatsToBook) * ride.costPerSeat;

  const handleBookRide = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'Please log in to book a ride.',
      });
      return;
    }

    if (isOwnRide) {
      toast({
        variant: 'destructive',
        title: 'Cannot Book',
        description: 'You cannot book your own ride.',
      });
      return;
    }

    const seats = parseInt(seatsToBook);
    if (seats > ride.availableSeats) {
      toast({
        variant: 'destructive',
        title: 'Not Enough Seats',
        description: `Only ${ride.availableSeats} seat(s) available.`,
      });
      return;
    }

    setIsBooking(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    createBookingMutation.mutate({
      rideId: ride.id,
      passengerId: user.id,
      seatsBooked: seats,
      amountToPayDriver: totalCost,
      status: 'confirmed',
      bookedAt: new Date(),
    });

    // Update ride status to BOOKED
    await rideService.updateRide(ride.id, { status: 'BOOKED' });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/my-bookings');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-4 pb-6">
        <div className="max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 -ml-2 mb-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Ride Details</h1>
        </div>
      </div>

      <div className="px-4 -mt-3 max-w-lg mx-auto space-y-4">
        {/* Route Card */}
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(ride.departureTime, 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="text-muted-foreground">at</span>
              <span className="font-medium">
                {format(ride.departureTime, 'h:mm a')}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="w-0.5 h-12 bg-border" />
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="font-semibold">{ride.startLocation.name}</p>
                  <p className="text-sm text-muted-foreground">{ride.startLocation.address}</p>
                </div>
                <div>
                  <p className="font-semibold">{ride.endLocation.name}</p>
                  <p className="text-sm text-muted-foreground">{ride.endLocation.address}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{ride.availableSeats} seats available</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                ride.direction === 'to_office' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {ride.direction === 'to_office' ? 'To Office' : 'From Office'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Driver Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Driver</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <User className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{driver?.name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {driverInfo && (
                    <>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        {driverInfo.rating.toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{driverInfo.totalRides} rides</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        {vehicle && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vehicle</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                  <Car className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.color} • {vehicle.licensePlate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Section */}
        {!isOwnRide && ride.availableSeats > 0 && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Book This Ride</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seats Selection */}
                <div className="space-y-2">
                  <Label>Number of Seats</Label>
                  <Select value={seatsToBook} onValueChange={setSeatsToBook}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {Array.from({ length: ride.availableSeats }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1} seat{i > 0 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost per seat</span>
                    <span>₹{ride.costPerSeat}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Seats</span>
                    <span>× {seatsToBook}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Amount to pay driver</span>
                    <span className="text-primary">₹{totalCost}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Button */}
            <Button 
              className="w-full h-12 text-base"
              onClick={handleBookRide}
              disabled={isBooking}
            >
              {isBooking ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  Booking...
                </span>
              ) : (
                `Book Ride (Pay ₹${totalCost} to driver)`
              )}
            </Button>
          </>
        )}

        {isOwnRide && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">This is your ride</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => navigate('/my-rides')}
              >
                Manage Your Rides
              </Button>
            </CardContent>
          </Card>
        )}

        {!isOwnRide && ride.availableSeats === 0 && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">This ride is fully booked</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => navigate('/find-rides')}
              >
                Find Other Rides
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-popover text-center">
          <div className="py-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Booking Confirmed!</DialogTitle>
              <DialogDescription className="text-center">
                Your ride has been booked successfully. You'll receive a confirmation shortly.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-2xl font-bold text-primary">₹{totalCost}</p>
              </div>
              <Button className="w-full" onClick={handleSuccessClose}>
                View My Bookings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RideDetailsPage;
