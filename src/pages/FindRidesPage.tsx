import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Users, Search, MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import LocationPicker from '@/components/LocationPicker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { rideService } from '@/lib/firestore';
import { Ride, Location } from '@/types';

const FindRidesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [direction, setDirection] = useState<'all' | 'to_office' | 'from_office'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState('');
  const [minSeats, setMinSeats] = useState('1');
  const clearFilters = () => {
    setFromLocation(null);
    setToLocation(null);
    setDirection('all');
    setSelectedDate(undefined);
    setMaxPrice('');
    setMinSeats('1');
  };

  // Fetch available rides with filters
  const { data: allRides = [], isLoading, error } = useQuery({
    queryKey: ['available-rides'],
    queryFn: async () => {
      console.log('🔍 FindRidesPage: Starting to fetch available rides...');
      // Get ALL available rides, filter client-side only
      const rides = await rideService.getAvailableRides();
      console.log('📊 FindRidesPage: Raw rides from server:', rides);
      console.log('👤 FindRidesPage: Current user ID:', user?.id);
      console.log('🎭 FindRidesPage: Current user role:', user?.role);
      
      // Filter out user's own rides
      const filteredRides = rides.filter(ride => ride.driverId !== user?.id);
      console.log('✅ FindRidesPage: After filtering own rides:', filteredRides);
      
      return filteredRides;
    },
    enabled: !!user,
  });

  // Filter available rides based on search criteria
  const availableRides = allRides.filter(ride => {
    console.log('🔍 FindRidesPage: Filtering ride:', {
      id: ride.id,
      status: ride.status,
      direction: ride.direction,
      departureTime: ride.departureTime,
      driverId: ride.driverId
    });
    
    // Filter by from location
    if (fromLocation && ride.startLocation.name !== fromLocation.name) {
      console.log('❌ FindRidesPage: Filtered out by fromLocation');
      return false;
    }
    // Filter by to location
    if (toLocation && ride.endLocation.name !== toLocation.name) {
      console.log('❌ FindRidesPage: Filtered out by toLocation');
      return false;
    }
    // Filter by direction
    if (direction !== 'all' && ride.direction !== direction) {
      console.log('❌ FindRidesPage: Filtered out by direction', { filter: direction, rideDirection: ride.direction });
      return false;
    }
    // Filter by date
    if (selectedDate) {
      const rideDate = new Date(ride.departureTime).toDateString();
      const filterDate = selectedDate.toDateString();
      if (rideDate !== filterDate) {
        console.log('❌ FindRidesPage: Filtered out by date', { rideDate, filterDate });
        return false;
      }
    }
    // Filter by max price
    if (maxPrice && ride.costPerSeat > parseInt(maxPrice)) {
      console.log('❌ FindRidesPage: Filtered out by maxPrice');
      return false;
    }
    // Filter by min seats
    if (minSeats && ride.availableSeats < parseInt(minSeats)) {
      console.log('❌ FindRidesPage: Filtered out by minSeats');
      return false;
    }
    
    console.log('✅ FindRidesPage: Ride passed all filters');
    return true;
  }).sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
  
  console.log('🎯 FindRidesPage: Final availableRides count:', availableRides.length);

  const RideCard = ({ ride }: { ride: Ride }) => {
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/ride/${ride.id}`)}
      >
        <CardContent className="p-3 md:p-4">
          <div className="space-y-2 md:space-y-3">
            {/* Time & Direction Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(ride.departureTime, 'EEE, MMM d • h:mm a')}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                ride.direction === 'to_office'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-accent/10 text-accent-foreground'
              }`}>
                {ride.direction === 'to_office' ? 'To Office' : 'From Office'}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-0.5 h-4 md:h-6 bg-border" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1 md:space-y-2">
                <p className="font-medium text-sm md:text-base">{ride.startLocation.name}</p>
                <p className="text-muted-foreground text-sm">{ride.endLocation.name}</p>
              </div>
            </div>

            {/* Seats & Price */}
            <div className="flex items-center justify-between pt-1 md:pt-2 border-t border-border">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{ride.availableSeats} seats left</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">₹{ride.costPerSeat}</p>
                <p className="text-xs text-muted-foreground">per seat</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-6 md:pt-8 pb-4 md:pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Find a Ride</h1>
              <p className="text-primary-foreground/80 mt-1 text-sm md:text-base">Discover available commute options</p>
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

      {/* Search & Filters */}
      <div className="px-4 -mt-2 md:-mt-3 max-w-lg mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-3 md:p-4 space-y-3">
            <LocationPicker
              value={fromLocation}
              onChange={setFromLocation}
              placeholder="From location"
            />
            <LocationPicker
              value={toLocation}
              onChange={setToLocation}
              placeholder="To location"
            />
            <Select value={direction} onValueChange={(value) => setDirection(value as 'all' | 'to_office' | 'from_office')}>
              <SelectTrigger>
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="to_office">To Office</SelectItem>
                <SelectItem value="from_office">From Office</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  type="number"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="pl-6"
                  min="0"
                />
              </div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Min seats"
                  value={minSeats}
                  onChange={(e) => setMinSeats(e.target.value)}
                  className="pl-9"
                  min="1"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="px-4 mt-4 md:mt-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-base md:text-lg font-semibold">
            {availableRides.length} ride{availableRides.length !== 1 ? 's' : ''} available
          </h2>
        </div>

        {availableRides.length > 0 ? (
          <div className="space-y-4">
            {availableRides.map(ride => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No rides found</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search filters or check back later
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FindRidesPage;
