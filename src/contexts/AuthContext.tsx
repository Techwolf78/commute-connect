import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '../types';
import { 
  getSession, setSession, clearSession, 
  getUsers, setUsers, getOTP, setOTP, clearOTP,
  clearAllData
} from '../lib/storage';
import { generateId, initializeDummyData } from '../lib/dummy-data';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDummyData();
    checkSession();
  }, []);

  const checkSession = () => {
    const session = getSession();
    if (session && new Date(session.expiresAt) > new Date()) {
      const users = getUsers();
      const currentUser = users[session.userId];
      if (currentUser) {
        setUser(currentUser);
      }
    }
    setIsLoading(false);
  };

  const refreshUser = () => {
    const session = getSession();
    if (session) {
      const users = getUsers();
      const currentUser = users[session.userId];
      if (currentUser) {
        setUser(currentUser);
      }
    }
  };

  const sendOTP = async (phone: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate dummy OTP (always 123456 for testing)
    const otpData = {
      phone,
      otp: '123456',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      verified: false,
    };
    
    setOTP(otpData);
    console.log('OTP for testing:', otpData.otp);
    return true;
  };

  const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const otpData = getOTP();
    
    // Check if OTP matches and hasn't expired
    if (
      otpData &&
      otpData.phone === phone &&
      otpData.otp === otp &&
      new Date(otpData.expiresAt) > new Date()
    ) {
      clearOTP();
      
      // Check if user exists or create new user
      const users = getUsers();
      let existingUser = Object.values(users).find(u => u.phone === phone);
      
      if (!existingUser) {
        // Create new user
        const newUser: User = {
          id: generateId(),
          phone,
          name: '',
          isProfileComplete: false,
          role: 'passenger',
          createdAt: new Date().toISOString(),
        };
        users[newUser.id] = newUser;
        setUsers(users);
        existingUser = newUser;
      }
      
      // Create session
      const newSession: Session = {
        userId: existingUser.id,
        token: generateId(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      setSession(newSession);
      setUser(existingUser);
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    clearAllData();
    setUser(null);
    // Reinitialize dummy data for next session
    initializeDummyData();
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    
    const users = getUsers();
    const updatedUser = { ...user, ...updates };
    users[user.id] = updatedUser;
    setUsers(users);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sendOTP,
        verifyOTP,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
