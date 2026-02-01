import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, Clock, ArrowRight, 
  Car, XCircle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { Booking, BookingStatus, Ride, User, Driver } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService, rideService, userService, driverService, ratingService } from '@/lib/firestore';
import { CancellationForm } from '@/components/CancellationForm';
import { BookingCard } from '@/components/BookingCard';
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

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  
  // Fetch user's bookings with full data
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['user-bookings-full', user?.id],
    queryFn: async () => {
      const bookings = await bookingService.getBookingsByPassenger(user!.id);
      const bookingsArray = Array.isArray(bookings) ? bookings : [];

      // Fetch ride and driver data for each booking
      const bookingsWithData = await Promise.all(
        bookingsArray.map(async (booking) => {
          try {
            const ride = await rideService.getRide(booking.rideId);
            if (!ride) return null;

            const driver = await userService.getUser(ride.driverId);
            const driverInfo = await driverService.getDriver(ride.driverId);

            return { booking, ride, driver, driverInfo };
          } catch (error) {
            console.error('Error fetching data for booking:', booking.id, error);
            return null;
          }
        })
      );

      return bookingsWithData.filter(item => item !== null);
    },
    enabled: !!user,
  });

  const allBookings = Array.isArray(bookingsData) ? bookingsData : [];

  // Fetch all rides (needed for booking details)
  // const { data: rides = [], isLoading: ridesLoading } = useQuery({
  //   queryKey: ['all-rides'],
  //   queryFn: () => rideService.getAllRides(),
  //   enabled: !!user,
  // });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      bookingService.cancelBooking(bookingId, reason, 'passenger'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings-full'] });
      toast({ title: 'Success', description: 'Booking cancelled successfully. The driver has been notified.' });
      setCancelBookingId(null);
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel booking.' });
    },
  });

  if (bookingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const userBookings = allBookings
    .filter(item => item && item.booking.passengerId === user?.id)
    .sort((a, b) => new Date(b!.booking.bookedAt).getTime() - new Date(a!.booking.bookedAt).getTime());

  const upcomingBookings = userBookings.filter(item => 
    item!.booking.status === 'confirmed' || item!.booking.status === 'pending'
  );
  const completedBookings = userBookings.filter(item => item!.booking.status === 'completed');
  const cancelledBookings = userBookings.filter(item => item!.booking.status === 'cancelled');

  const handleCancelBooking = (bookingId: string, reason: string) => {
    cancelBookingMutation.mutate({ bookingId, reason });
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{message}</p>
        <Button 
          variant="link" 
          className="mt-2"
          onClick={() => navigate('/find-rides')}
        >
          Find a Ride
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Bookings</h1>
              <p className="text-primary-foreground/80 mt-1">Manage your ride bookings</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              user?.role === 'driver' 
                ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30' 
                : 'bg-green-500/20 text-green-100 border border-green-400/30'
            }`}>
              {user?.role === 'driver' ? 'Driver' : 'Passenger'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 max-w-lg mx-auto">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map(item => (
                <BookingCard 
                  key={item!.booking.id} 
                  booking={item!.booking} 
                  ride={item!.ride}
                  driver={item!.driver}
                  driverInfo={item!.driverInfo}
                />
              ))
            ) : (
              <EmptyState message="No upcoming bookings" />
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length > 0 ? (
              completedBookings.map(item => (
                <BookingCard 
                  key={item!.booking.id} 
                  booking={item!.booking} 
                  ride={item!.ride}
                  driver={item!.driver}
                  driverInfo={item!.driverInfo}
                />
              ))
            ) : (
              <EmptyState message="No completed bookings yet" />
            )}
          </TabsContent>
          
          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.length > 0 ? (
              cancelledBookings.map(item => (
                <BookingCard 
                  key={item!.booking.id} 
                  booking={item!.booking} 
                  ride={item!.ride}
                  driver={item!.driver}
                  driverInfo={item!.driverInfo}
                />
              ))
            ) : (
              <EmptyState message="No cancelled bookings" />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Booking Form */}
      <CancellationForm
        isOpen={!!cancelBookingId}
        onClose={() => setCancelBookingId(null)}
        onConfirm={(reason) => cancelBookingId && handleCancelBooking(cancelBookingId, reason)}
        title="Cancel Booking"
        description="Please provide a reason for cancelling this booking. The driver will be notified."
        isLoading={cancelBookingMutation.isPending}
      />
    </div>
  );
};

export default MyBookingsPage;
