import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Car, CheckCircle2, Shield, Users, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getDrivers, setDrivers, getVehicles, setVehicles } from '@/lib/storage';
import { generateId } from '@/lib/dummy-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BecomeDriverPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2023');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [seats, setSeats] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if already a driver
  const drivers = getDrivers();
  if (user && drivers[user.id]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-3" />
            <h2 className="font-semibold text-lg mb-2">You're Already a Driver!</h2>
            <p className="text-muted-foreground mb-4">
              Start offering rides to share your commute
            </p>
            <Button onClick={() => navigate('/create-ride')}>
              Create a Ride
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const carMakes = [
    'Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Toyota', 
    'Mahindra', 'Kia', 'Volkswagen', 'Skoda', 'MG'
  ];

  const years = Array.from({ length: 15 }, (_, i) => String(2024 - i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!make.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select car make.' });
      return;
    }
    if (!model.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter car model.' });
      return;
    }
    if (!color.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter car color.' });
      return;
    }
    if (!licensePlate.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter license plate.' });
      return;
    }

    // Validate license plate format (basic)
    const plateRegex = /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,2}\s?\d{4}$/i;
    if (!plateRegex.test(licensePlate.replace(/\s/g, ''))) {
      toast({ variant: 'destructive', title: 'Invalid Format', description: 'Please enter a valid license plate (e.g., HR 26 AB 1234).' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create vehicle
      const vehicleId = generateId();
      const vehicles = getVehicles();
      vehicles[vehicleId] = {
        id: vehicleId,
        driverId: user!.id,
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        color: color.trim(),
        licensePlate: licensePlate.toUpperCase().trim(),
        seats: parseInt(seats),
      };
      setVehicles(vehicles);

      // Create driver profile
      const allDrivers = getDrivers();
      allDrivers[user!.id] = {
        userId: user!.id,
        vehicleId,
        isVerified: true,
        rating: 5.0,
        totalRides: 0,
        joinedAsDriverAt: new Date().toISOString(),
      };
      setDrivers(allDrivers);

      // Update user role
      updateUser({ role: 'driver' });

      setShowSuccess(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to register as driver.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
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
          <h1 className="text-2xl font-bold">Become a Driver</h1>
          <p className="text-primary-foreground/80 mt-1">Share your commute and save costs</p>
        </div>
      </div>

      <div className="px-4 mt-4 max-w-lg mx-auto space-y-4">
        {/* Benefits */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Why drive with CommutePal?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Share Commute Costs</p>
                  <p className="text-sm text-muted-foreground">Split fuel and toll expenses with co-passengers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Build Connections</p>
                  <p className="text-sm text-muted-foreground">Meet professionals on similar routes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Verified Community</p>
                  <p className="text-sm text-muted-foreground">Ride with verified office commuters</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Select value={make} onValueChange={setMake}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {carMakes.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    placeholder="e.g., Swift"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover max-h-60">
                      {years.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    placeholder="e.g., White"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>License Plate</Label>
                <Input
                  placeholder="e.g., HR 26 AB 1234"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Passenger Seats</Label>
                <Select value={seats} onValueChange={setSeats}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {[2, 3, 4, 5, 6, 7].map(s => (
                      <SelectItem key={s} value={String(s)}>
                        {s} seats
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Number of seats available for passengers (excluding driver)
                </p>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-12 text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                Registering...
              </span>
            ) : (
              'Register as Driver'
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
              <DialogTitle className="text-center text-xl">Welcome, Driver!</DialogTitle>
              <DialogDescription className="text-center">
                You're now registered as a driver. Start offering rides and share your commute!
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={() => navigate('/create-ride')}>
                Create Your First Ride
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BecomeDriverPage;
