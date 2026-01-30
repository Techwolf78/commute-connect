import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Clock, Users, Star, 
  ArrowRight, Filter, Calendar, Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRides, getUsers, getDrivers, getVehicles } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { SAMPLE_LOCATIONS } from '@/lib/dummy-data';
import { format } from 'date-fns';
import { Ride } from '@/types';

const FindRidesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [direction, setDirection] = useState<'all' | 'to_office' | 'from_office'>('all');
  
  const rides = getRides();
  const users = getUsers();
  const drivers = getDrivers();
  const vehicles = getVehicles();

  // Filter available rides
  const availableRides = Object.values(rides)
    .filter(ride => {
      if (ride.status !== 'scheduled') return false;
      if (new Date(ride.departureTime) <= new Date()) return false;
      if (ride.availableSeats <= 0) return false;
      if (ride.driverId === user?.id) return false;
      
      if (direction !== 'all' && ride.direction !== direction) return false;
      
      if (fromLocation && !ride.startLocation.name.toLowerCase().includes(fromLocation.toLowerCase())) {
        return false;
      }
      if (toLocation && !ride.endLocation.name.toLowerCase().includes(toLocation.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

  const RideCard = ({ ride }: { ride: Ride }) => {
    const driver = users[ride.driverId];
    const driverInfo = drivers[ride.driverId];
    const vehicle = vehicles[ride.vehicleId];
    
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
                  {format(new Date(ride.departureTime), 'EEE, MMM d • h:mm a')}
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
            
            {/* Driver & Vehicle Info */}
            <div className="flex items-center justify-between pt-1 md:pt-2 border-t border-border">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm md:text-base">{driver?.name || 'Driver'}</p>
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                    {vehicle && (
                      <span>{vehicle.make} {vehicle.model}</span>
                    )}
                    {driverInfo && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {driverInfo.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg md:text-xl font-bold text-primary">₹{ride.costPerSeat}</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {ride.availableSeats} seat{ride.availableSeats > 1 ? 's' : ''} left
                </p>
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
          <h1 className="text-xl md:text-2xl font-bold">Find a Ride</h1>
          <p className="text-primary-foreground/80 mt-1 text-sm md:text-base">Discover available commute options</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 -mt-2 md:-mt-3 max-w-lg mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-3 md:p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="From location"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="To location"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={direction} onValueChange={(value: any) => setDirection(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="to_office">To Office</SelectItem>
                <SelectItem value="from_office">From Office</SelectItem>
              </SelectContent>
            </Select>
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

import { User } from 'lucide-react';

export default FindRidesPage;
