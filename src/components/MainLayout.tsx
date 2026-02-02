import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, Car, User, Plus, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { chatService } from '@/lib/firestore';
import { Chat } from '@/types';

const MainLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isDriver = user?.role === 'driver';

  const [chats, setChats] = useState<Chat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<{ [chatId: string]: number }>({});

  const messageUnsubscribersRef = useRef<{ [chatId: string]: () => void }>({});

  // Listen to user chats in real-time
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = chatService.listenToUserChats(user.id, (updatedChats) => {
      setChats(updatedChats);
    });

    return unsubscribe;
  }, [user?.id]);

  // Set up listeners for unread messages in each chat
  useEffect(() => {
    if (!user?.id || !chats.length) return;

    const newUnsubscribers: { [chatId: string]: () => void } = {};

    chats.forEach((chat) => {
      const unsubscribe = chatService.listenToMessages(chat.id, (messages) => {
        const unreadForChat = messages.filter(
          (msg) => msg.s !== user.id && !msg.isRead
        ).length;
        setUnreadCounts((prev) => ({
          ...prev,
          [chat.id]: unreadForChat,
        }));
      });
      newUnsubscribers[chat.id] = unsubscribe;
    });

    // Clean up previous unsubscribers
    Object.values(messageUnsubscribersRef.current).forEach((unsub) => unsub());
    messageUnsubscribersRef.current = newUnsubscribers;

    return () => {
      Object.values(newUnsubscribers).forEach((unsub) => unsub());
    };
  }, [chats, user?.id]);

  // Update total unread count when unreadCounts change
  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    setUnreadCount(total);
  }, [unreadCounts]);

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/find-rides', icon: Search, label: 'Find Rides' },
    { to: '/my-bookings', icon: Calendar, label: 'Bookings' },
    ...(isDriver ? [{ to: '/my-rides', icon: Car, label: 'My Rides' }] : []),
    { to: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadCount },
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
        <div className="flex items-center justify-around h-14 md:h-16 max-w-lg mx-auto px-1 md:px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-2 rounded-lg transition-colors min-w-[50px] md:min-w-[60px] relative',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <item.icon className={cn('h-4 w-4 md:h-5 md:w-5', isActive && 'stroke-[2.5px]')} />
                  {item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] md:text-xs font-medium leading-tight">{item.label}</span>
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
            className="fixed bottom-16 md:bottom-20 right-3 md:right-4 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg z-40"
          >
            <Plus className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </NavLink>
      )}
    </div>
  );
};

export default MainLayout;
