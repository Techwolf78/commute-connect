import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Building2, ArrowRight, Camera, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import LocationPicker from '@/components/LocationPicker';
import { Location } from '@/types';

const CompleteProfilePage = () => {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [homeLocation, setHomeLocation] = useState<Location | null>(null);
  const [officeLocation, setOfficeLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update form fields when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setHomeLocation(user.homeLocation || null);
      setOfficeLocation(user.officeLocation || null);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authLoading) {
      return; // Wait for user data to load
    }
    
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name Required',
        description: 'Please enter your full name.',
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        variant: 'destructive',
        title: 'Phone Number Required',
        description: 'Please enter your phone number.',
      });
      return;
    }

    if (!homeLocation) {
      toast({
        variant: 'destructive',
        title: 'Home Location Required',
        description: 'Please select your home location.',
      });
      return;
    }

    if (!officeLocation) {
      toast({
        variant: 'destructive',
        title: 'Office Location Required',
        description: 'Please select your office location.',
      });
      return;
    }

    if (homeLocation.id === officeLocation.id) {
      toast({
        variant: 'destructive',
        title: 'Invalid Selection',
        description: 'Home and office locations must be different.',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!user) {
        throw new Error('User not found. Please try logging in again.');
      }

      if (!user.id) {
        throw new Error('User ID is missing. Please try logging in again.');
      }

      updateUser({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        homeLocation,
        officeLocation,
        isProfileComplete: true,
      });

      toast({
        title: 'Profile Completed',
        description: 'Welcome to CommutePal!',
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1">Tell us about yourself to get started</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Profile Photo Placeholder */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                    onClick={() => toast({ title: 'Coming Soon', description: 'Photo upload will be available soon.' })}
                  >
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  </button>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email (Optional)
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>

              {/* Phone Input */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Home Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Home Location <span className="text-destructive">*</span>
                </label>
                <LocationPicker
                  value={homeLocation}
                  onChange={setHomeLocation}
                  placeholder="Search for your home location"
                  disabled={isLoading}
                />
              </div>

              {/* Office Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Office Location <span className="text-destructive">*</span>
                </label>
                <LocationPicker
                  value={officeLocation}
                  onChange={setOfficeLocation}
                  placeholder="Search for your office location"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || !name.trim() || !phone.trim() || !homeLocation || !officeLocation}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Complete Profile
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
