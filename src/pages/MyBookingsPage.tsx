import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, Clock, ArrowRight, 
  Car, XCircle, CheckCircle2, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBookings, getRides, getUsers, getDrivers, setBookings } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Booking, BookingStatus } from '@/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { getRatings, setRatings } from '@/lib/storage';
import { generateId } from '@/lib/dummy-data';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const bookings = getBookings();
  const rides = getRides();
  const users = getUsers();
  const drivers = getDrivers();

  const userBookings = Object.values(bookings)
    .filter(booking => booking.passengerId === user?.id)
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

  const upcomingBookings = userBookings.filter(b => 
    b.status === 'confirmed' || b.status === 'pending'
  );
  const completedBookings = userBookings.filter(b => b.status === 'completed');
  const cancelledBookings = userBookings.filter(b => b.status === 'cancelled');

  const handleCancelBooking = (bookingId: string) => {
    const allBookings = getBookings();
    const booking = allBookings[bookingId];
    
    if (!booking) return;

    allBookings[bookingId] = {
      ...booking,
      status: 'cancelled',
      paymentStatus: 'refunded',
      cancelledAt: new Date().toISOString(),
    };
    
    setBookings(allBookings);
    
    // Restore seats to ride
    const allRides = getRides();
    const ride = allRides[booking.rideId];
    if (ride) {
      allRides[booking.rideId] = {
        ...ride,
        availableSeats: ride.availableSeats + booking.seatsBooked,
      };
      import('@/lib/storage').then(({ setRides }) => setRides(allRides));
    }
    
    toast({
      title: 'Booking Cancelled',
      description: 'Your booking has been cancelled. Refund will be processed shortly.',
    });
    
    setCancelBookingId(null);
  };

  const handleCompleteBooking = (bookingId: string) => {
    const allBookings = getBookings();
    allBookings[bookingId] = {
      ...allBookings[bookingId],
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    setBookings(allBookings);
    
    setRatingBookingId(bookingId);
    setShowRatingDialog(true);
  };

  const handleSubmitRating = () => {
    if (!ratingBookingId || rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
      });
      return;
    }

    const booking = bookings[ratingBookingId];
    const ride = rides[booking.rideId];
    
    const allRatings = getRatings();
    const newRating = {
      id: generateId(),
      bookingId: ratingBookingId,
      rideId: booking.rideId,
      fromUserId: user?.id || '',
      toUserId: ride.driverId,
      rating,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    
    allRatings[newRating.id] = newRating;
    setRatings(allRatings);
    
    toast({
      title: 'Rating Submitted',
      description: 'Thank you for your feedback!',
    });
    
    setShowRatingDialog(false);
    setRatingBookingId(null);
    setRating(0);
    setComment('');
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const ride = rides[booking.rideId];
    if (!ride) return null;
    
    const driver = users[ride.driverId];
    const driverInfo = drivers[ride.driverId];
    const isPast = new Date(ride.departureTime) < new Date();
    
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {format(new Date(ride.departureTime), 'EEE, MMM d • h:mm a')}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                booking.status === 'confirmed' ? 'bg-success/10 text-success' :
                booking.status === 'completed' ? 'bg-primary/10 text-primary' :
                booking.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                'bg-warning/10 text-warning'
              }`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium truncate">{ride.startLocation.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{ride.endLocation.name}</span>
            </div>

            {/* Driver Info */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{driver?.name}</span>
                {driverInfo && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    {driverInfo.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">₹{booking.totalCost}</p>
                <p className="text-xs text-muted-foreground">
                  {booking.seatsBooked} seat{booking.seatsBooked > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Actions */}
            {booking.status === 'confirmed' && (
              <div className="flex gap-2 pt-2">
                {isPast ? (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleCompleteBooking(booking.id)}
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
                      onClick={() => setCancelBookingId(booking.id)}
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
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-primary-foreground/80 mt-1">Manage your ride bookings</p>
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
              upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message="No upcoming bookings" />
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length > 0 ? (
              completedBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message="No completed bookings yet" />
            )}
          </TabsContent>
          
          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.length > 0 ? (
              cancelledBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message="No cancelled bookings" />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelBookingId} onOpenChange={() => setCancelBookingId(null)}>
        <AlertDialogContent className="bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? A full refund will be processed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => cancelBookingId && handleCancelBooking(cancelBookingId)}
              className="bg-destructive text-destructive-foreground"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="bg-popover">
          <DialogHeader>
            <DialogTitle>Rate Your Ride</DialogTitle>
            <DialogDescription>
              How was your experience? Your feedback helps maintain quality.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star 
                    className={`h-8 w-8 transition-colors ${
                      star <= rating 
                        ? 'fill-warning text-warning' 
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Add a comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <Button 
              className="w-full" 
              onClick={handleSubmitRating}
              disabled={rating === 0}
            >
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookingsPage;
