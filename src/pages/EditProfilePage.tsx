import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Building2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SAMPLE_LOCATIONS } from '@/lib/dummy-data';

const EditProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [homeLocationId, setHomeLocationId] = useState(user?.homeLocation?.id || '');
  const [officeLocationId, setOfficeLocationId] = useState(user?.officeLocation?.id || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name Required',
        description: 'Please enter your full name.',
      });
      return;
    }

    if (!homeLocationId) {
      toast({
        variant: 'destructive',
        title: 'Home Location Required',
        description: 'Please select your home location.',
      });
      return;
    }

    if (!officeLocationId) {
      toast({
        variant: 'destructive',
        title: 'Office Location Required',
        description: 'Please select your office location.',
      });
      return;
    }

    if (homeLocationId === officeLocationId) {
      toast({
        variant: 'destructive',
        title: 'Invalid Selection',
        description: 'Home and office locations must be different.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const homeLocation = SAMPLE_LOCATIONS.find(loc => loc.id === homeLocationId);
      const officeLocation = SAMPLE_LOCATIONS.find(loc => loc.id === officeLocationId);

      updateUser({
        name: name.trim(),
        email: email.trim() || undefined,
        homeLocation,
        officeLocation,
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });

      navigate('/profile');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
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
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>
      </div>

      <div className="px-4 mt-4 max-w-lg mx-auto">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Profile Photo */}
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

              {/* Name */}
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

              {/* Email */}
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

              {/* Phone (read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <Input
                  value={user?.phone || ''}
                  className="h-12 bg-muted"
                  disabled
                />
                <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
              </div>

              {/* Home Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Home Location <span className="text-destructive">*</span>
                </label>
                <Select value={homeLocationId} onValueChange={setHomeLocationId} disabled={isLoading}>
                  <SelectTrigger className="h-12">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <SelectValue placeholder="Select home location" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {SAMPLE_LOCATIONS.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Office Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Office Location <span className="text-destructive">*</span>
                </label>
                <Select value={officeLocationId} onValueChange={setOfficeLocationId} disabled={isLoading}>
                  <SelectTrigger className="h-12">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <SelectValue placeholder="Select office location" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {SAMPLE_LOCATIONS.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfilePage;
