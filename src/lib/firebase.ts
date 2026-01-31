import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug: Log environment variables (remove in production)
console.log('🔍 Firebase Environment Variables Check:');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing');
console.log('VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing');

console.log('📋 Firebase Config Object:', {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId,
  storageBucket: !!firebaseConfig.storageBucket,
  messagingSenderId: !!firebaseConfig.messagingSenderId,
  appId: !!firebaseConfig.appId,
  hasAllRequired: !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId)
});

// Initialize Firebase
let app;
let auth;
let db;

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error(`Missing required Firebase config. API Key: ${!!firebaseConfig.apiKey}, Auth Domain: ${!!firebaseConfig.authDomain}, Project ID: ${!!firebaseConfig.projectId}`);
  }

  console.log('🚀 Initializing Firebase app...');
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');

  console.log('🔐 Initializing Firebase auth...');
  auth = getAuth(app);
  console.log('✅ Firebase auth initialized successfully');

  console.log('🗄️ Initializing Firestore...');
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');

  console.log('🎉 All Firebase services initialized successfully!');

} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
  console.error('🔍 Firebase config values:', {
    apiKey: firebaseConfig.apiKey ? 'Set (length: ' + firebaseConfig.apiKey.length + ')' : 'Not set',
    authDomain: firebaseConfig.authDomain || 'Not set',
    projectId: firebaseConfig.projectId || 'Not set',
    storageBucket: firebaseConfig.storageBucket || 'Not set',
    messagingSenderId: firebaseConfig.messagingSenderId || 'Not set',
    appId: firebaseConfig.appId ? 'Set (length: ' + firebaseConfig.appId.length + ')' : 'Not set'
  });
  // Create dummy objects to prevent crashes
  app = {} as any;
  auth = {} as any;
  db = {} as any;
}

export { app, auth, db };

// Export types for convenience
export type { User as FirebaseUser } from 'firebase/auth';