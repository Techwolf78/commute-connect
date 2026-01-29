import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, MapPin, Building2, Phone, Mail, 
  ChevronRight, LogOut, Car, Star, Edit2, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getDrivers, getVehicles } from '@/lib/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const drivers = getDrivers();
  const vehicles = getVehicles();
  
  const isDriver = user?.role === 'driver';
  const driverInfo = isDriver ? drivers[user?.id || ''] : null;
  const vehicle = driverInfo ? vehicles[driverInfo.vehicleId] : null;

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-8 pb-16 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-10 max-w-lg mx-auto space-y-4">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-muted-foreground">{user?.phone}</p>
                {isDriver && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-sm px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      <Car className="h-3 w-3" />
                      Driver
                    </span>
                    {driverInfo && (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {driverInfo.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/edit-profile')}
              >
                <Edit2 className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="flex items-center gap-4 p-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{user?.phone}</p>
                </div>
              </div>
              
              {user?.email && (
                <div className="flex items-center gap-4 p-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 p-4">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Home Location</p>
                  <p className="font-medium">{user?.homeLocation?.name || 'Not set'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Office Location</p>
                  <p className="font-medium">{user?.officeLocation?.name || 'Not set'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details (for drivers) */}
        {isDriver && vehicle && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium">{vehicle.make} {vehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{vehicle.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Plate</span>
                  <span className="font-medium">{vehicle.licensePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seats Available</span>
                  <span className="font-medium">{vehicle.seats}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Items */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {!isDriver && (
                <button 
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  onClick={() => navigate('/become-driver')}
                >
                  <Car className="h-5 w-5 text-primary" />
                  <span className="flex-1 text-left font-medium">Become a Driver</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
              
              <button 
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                onClick={() => navigate('/my-bookings')}
              >
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-left font-medium">My Bookings</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              
              {isDriver && (
                <button 
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  onClick={() => navigate('/my-rides')}
                >
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 text-left font-medium">My Rides</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
              
              <button 
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                onClick={() => toast({ title: 'Coming Soon', description: 'This feature will be available soon.' })}
              >
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-left font-medium">Privacy & Security</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full h-12 text-destructive border-destructive/30">
              <LogOut className="h-5 w-5 mr-2" />
              Log Out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-popover">
            <AlertDialogHeader>
              <AlertDialogTitle>Log Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out? All local data will be cleared.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground">
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

import { Calendar } from 'lucide-react';

export default ProfilePage;
