import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService } from '../lib/firestore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      console.error('Firebase auth not properly initialized');
      setIsLoading(false);
      return () => {};
    }

    try {
      // Listen to authentication state changes
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          setFirebaseUser(firebaseUser);

          if (firebaseUser) {
            try {
              // Get user profile from Firestore
              const userProfile = await userService.getUser(firebaseUser.uid);
              if (userProfile) {
                setUser(userProfile);
              } else {
                // Create user profile if it doesn't exist
                const newUser: User = {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  email: firebaseUser.email || '',
                  role: 'passenger',
                  createdAt: new Date().toISOString(),
                };
                await userService.createUser(newUser);
                setUser(newUser);
              }
            } catch (error) {
              console.error('Error loading user profile:', error);
              // Fallback: create user object from Firebase user data
              const fallbackUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: 'passenger',
                createdAt: new Date().toISOString(),
              };
              setUser(fallbackUser);
            }
          } else {
            setUser(null);
          }

          setIsLoading(false);
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          setUser(null);
          setIsLoading(false);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setIsLoading(false);
      return () => {};
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth || typeof auth.signInWithEmailAndPassword !== 'function') {
      throw new Error('Firebase auth not initialized');
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!auth || typeof auth.createUserWithEmailAndPassword !== 'function') {
      throw new Error('Firebase auth not initialized');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(userCredential.user, { displayName: name });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user profile in Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        name,
        email,
        role: 'passenger',
        createdAt: new Date().toISOString(),
      };

      await userService.createUser(newUser);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth || typeof auth.signInWithPopup !== 'function') {
      const errorMsg = 'Firebase auth not initialized. Please check that all Firebase environment variables are set correctly in Vercel.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth || typeof auth.signOut !== 'function') {
      throw new Error('Firebase auth not initialized');
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Ensure user has an id - if not, try to get it from firebaseUser
    let userId = user.id;
    if (!userId && firebaseUser) {
      userId = firebaseUser.uid;
    }

    if (!userId) {
      throw new Error('User ID is missing - no firebaseUser available');
    }

    try {
      const updatedUser = { ...user, ...updates, id: userId };
      await userService.updateUser(userId, updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;

    try {
      const userProfile = await userService.getUser(firebaseUser.uid);
      if (userProfile) {
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!firebaseUser,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
