import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, Calendar as CalendarIcon, 
  Users, IndianRupee, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SAMPLE_LOCATIONS } from '@/lib/dummy-data';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { RideDirection } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rideService, driverService, vehicleService, userService } from '@/lib/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CreateRidePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch driver and vehicle data
  const { data: driverInfo, isLoading: driverLoading } = useQuery({
    queryKey: ['driver', user?.id],
    queryFn: () => driverService.getDriver(user!.id),
    enabled: !!user,
  });

  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ['vehicle', driverInfo?.vehicleId],
    queryFn: () => vehicleService.getVehicle(driverInfo!.vehicleId),
    enabled: !!driverInfo?.vehicleId,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => userService.getUser(user!.id),
    enabled: !!user,
  });
  
  const [direction, setDirection] = useState<RideDirection>('to_office');
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState('08:30');
  const [startLocationId, setStartLocationId] = useState('');
  const [endLocationId, setEndLocationId] = useState('');
  const [availableSeats, setAvailableSeats] = useState('3');
  const [costPerSeat, setCostPerSeat] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Show loading while fetching driver data
  if (driverLoading || vehicleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Check if user is a driver
  if (!driverInfo || !vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="font-semibold text-lg mb-2">Become a Driver First</h2>
            <p className="text-muted-foreground mb-4">
              You need to register as a driver to offer rides
            </p>
            <Button onClick={() => navigate('/become-driver')}>
              Become a Driver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  const handleDirectionChange = (value: RideDirection) => {
    setDirection(value);
    // Auto-fill locations based on direction
    if (userProfile?.homeLocation && userProfile?.officeLocation) {
      if (value === 'to_office') {
        setStartLocationId(userProfile.homeLocation.id);
        setEndLocationId(userProfile.officeLocation.id);
      } else {
        setStartLocationId(userProfile.officeLocation.id);
        setEndLocationId(userProfile.homeLocation.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a date.' });
      return;
    }
    if (!startLocationId || !endLocationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select pickup and drop locations.' });
      return;
    }
    if (startLocationId === endLocationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Start and end locations must be different.' });
      return;
    }
    if (!costPerSeat || parseInt(costPerSeat) <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid cost per seat.' });
      return;
    }

    setIsCreating(true);

    try {
      const [hours, minutes] = time.split(':').map(Number);
      const departureTime = setMinutes(setHours(date, hours), minutes);

      if (departureTime <= new Date()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Departure time must be in the future.' });
        setIsCreating(false);
        return;
      }

      const startLocation = SAMPLE_LOCATIONS.find(loc => loc.id === startLocationId)!;
      const endLocation = SAMPLE_LOCATIONS.find(loc => loc.id === endLocationId)!;

      await rideService.createRide({
        driverId: user!.id,
        vehicleId: vehicle.id,
        startLocation,
        endLocation,
        direction,
        departureTime,
        availableSeats: parseInt(availableSeats),
        totalSeats: parseInt(availableSeats),
        costPerSeat: parseInt(costPerSeat),
        status: 'scheduled',
        createdAt: new Date(),
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['available-rides'] });
      queryClient.invalidateQueries({ queryKey: ['driver-rides'] });

      setShowSuccess(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create ride.' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-3 md:pt-4 pb-4 md:pb-6">
        <div className="max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 -ml-2 mb-1 md:mb-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Offer a Ride</h1>
          <p className="text-primary-foreground/80 mt-1 text-sm md:text-base">Share your commute and save costs</p>
        </div>
      </div>

      <div className="px-4 mt-3 md:mt-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {/* Direction */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ride Direction</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={direction} 
                onValueChange={(v) => handleDirectionChange(v as RideDirection)}
                className="flex gap-3 md:gap-4"
              >
                <div className="flex-1">
                  <RadioGroupItem value="to_office" id="to_office" className="peer sr-only" />
                  <Label 
                    htmlFor="to_office" 
                    className="flex flex-col items-center p-3 md:p-4 border-2 rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <span className="font-medium text-sm md:text-base">To Office</span>
                    <span className="text-xs text-muted-foreground">Morning commute</span>
                  </Label>
                </div>
                <div className="flex-1">
                  <RadioGroupItem value="from_office" id="from_office" className="peer sr-only" />
                  <Label 
                    htmlFor="from_office" 
                    className="flex flex-col items-center p-3 md:p-4 border-2 rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <span className="font-medium text-sm md:text-base">From Office</span>
                    <span className="text-xs text-muted-foreground">Evening commute</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="h-12">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover max-h-60">
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Route */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pickup Location</Label>
                <Select value={startLocationId} onValueChange={setStartLocationId}>
                  <SelectTrigger className="h-12">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select pickup point" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {SAMPLE_LOCATIONS.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
              </div>

              <div className="space-y-2">
                <Label>Drop Location</Label>
                <Select value={endLocationId} onValueChange={setEndLocationId}>
                  <SelectTrigger className="h-12">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select drop point" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {SAMPLE_LOCATIONS.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Seats & Cost */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Seats & Cost Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Available Seats</Label>
                <Select value={availableSeats} onValueChange={setAvailableSeats}>
                  <SelectTrigger className="h-12">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {Array.from({ length: vehicle.seats }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1} seat{i > 0 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cost Per Seat (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="e.g., 80"
                    value={costPerSeat}
                    onChange={(e) => setCostPerSeat(e.target.value)}
                    className="pl-9 h-12"
                    min="1"
                    max="500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Set a fair cost to share fuel and toll expenses
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Your Vehicle</p>
              <p className="font-medium">{vehicle.make} {vehicle.model} • {vehicle.color}</p>
              <p className="text-sm text-muted-foreground">{vehicle.licensePlate}</p>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base"
            disabled={isCreating}
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                Creating...
              </span>
            ) : (
              'Create Ride'
            )}
          </Button>
        </form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-popover text-center">
          <div className="py-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Ride Created!</DialogTitle>
              <DialogDescription className="text-center">
                Your ride has been published. Passengers can now book seats.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={() => navigate('/my-rides')}>
                View My Rides
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                setShowSuccess(false);
                navigate('/dashboard');
              }}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateRidePage;
