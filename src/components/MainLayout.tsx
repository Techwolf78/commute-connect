import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, Car, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const MainLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isDriver = user?.role === 'driver';

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/find-rides', icon: Search, label: 'Find Rides' },
    { to: '/my-bookings', icon: Calendar, label: 'Bookings' },
    ...(isDriver ? [{ to: '/my-rides', icon: Car, label: 'My Rides' }] : []),
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button for Drivers */}
      {isDriver && !location.pathname.includes('/create-ride') && (
        <NavLink to="/create-ride">
          <Button
            size="icon"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </NavLink>
      )}
    </div>
  );
};

export default MainLayout;
