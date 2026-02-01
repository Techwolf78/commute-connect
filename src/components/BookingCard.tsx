import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ArrowRight, Car, Star, CheckCircle2, XCircle } from 'lucide-react';
import { Booking, Ride, User, Driver } from '@/types';
import { ratingService } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

interface BookingCardProps {
  booking: Booking;
  ride: Ride;
  driver?: User;
  driverInfo?: Driver;
}

export const BookingCard = ({ booking, ride, driver, driverInfo }: BookingCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);

  const isPast = new Date(getDateFromTimestamp(ride.departureTime)) < new Date();

  // Check if booking has already been rated
  const { data: existingRating } = useQuery({
    queryKey: ['booking-rating', booking.id],
    queryFn: async () => {
      const ratings = await ratingService.getRatingsByBooking(booking.id);
      return ratings.length > 0 ? ratings[0] : null;
    },
    enabled: booking.status === 'completed',
  });

  // Set hasRated based on existing rating
  useEffect(() => {
    if (existingRating) {
      setHasRated(true);
      setRating(existingRating.rating);
    }
  }, [existingRating]);

  // Mutation for submitting rating
  const submitRatingMutation = useMutation({
    mutationFn: async (ratingValue: number) => {
      if (!user || !driver) return;
      return ratingService.createRating({
        bookingId: booking.id,
        rideId: ride.id,
        fromUserId: user.id,
        toUserId: driver.id,
        rating: ratingValue,
        createdAt: new Date(),
      });
    },
    onSuccess: () => {
      setHasRated(true);
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-rating', booking.id] });
    },
  });

  const handleRatingSubmit = (ratingValue: number) => {
    setRating(ratingValue);
    submitRatingMutation.mutate(ratingValue);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {format(getDateFromTimestamp(ride.departureTime), 'EEE, MMM d • h:mm a')}
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
              <p className="font-semibold text-primary">₹{booking.amountToPayDriver}</p>
              <p className="text-xs text-muted-foreground">
                Pay driver directly
              </p>
            </div>
          </div>

          {/* Actions */}
          {booking.status === 'confirmed' && !isPast && (
            <div className="flex gap-2 pt-2">
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
                onClick={() => {/* Handle cancel booking */}}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Rating Section for Completed Bookings */}
          {booking.status === 'completed' && (
            <div className="pt-2 border-t">
              {hasRated ? (
                <div className="text-center py-2">
                  <p className="text-sm text-green-600 font-medium">
                    Thank you for your feedback. We hope to see you again soon!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Rate your ride experience</p>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingSubmit(star)}
                        disabled={submitRatingMutation.isPending}
                        className="p-1 hover:scale-110 transition-transform disabled:opacity-50"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {submitRatingMutation.isPending && (
                    <p className="text-xs text-center text-muted-foreground">Submitting rating...</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};