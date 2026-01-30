# Commute Connect

A ride-sharing platform built by OFFICERIDES to connect commuters and make daily travel smarter, cheaper, and more social.

## 🚀 Overview

Commute Connect is a full-stack ride-sharing application that allows users to share rides for their daily commute. The platform connects passengers with drivers going the same route, reducing travel costs and environmental impact while fostering community connections.

### Key Features

- **Multiple Authentication**: Email/password and Google sign-in using Firebase Auth
- **Real-time Ride Sharing**: Create and join rides between home and office locations
- **Driver Verification**: Verified drivers with vehicle information
- **Booking System**: Seamless booking with payment integration
- **Rating System**: Rate drivers and passengers for trust and safety
- **Real-time Updates**: Live ride status and booking confirmations
- **Responsive Design**: Mobile-first design with modern UI

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components built on Radix UI
- **React Router** - Client-side routing
- **React Hook Form** - Form management with validation
- **Zod** - Schema validation
- **TanStack Query** - Data fetching and caching

**Backend & Services:**
- **Firebase Auth** - Email/password and Google authentication
- **Firestore** - NoSQL database for real-time data
- **Vercel** - Hosting and deployment platform

**Development Tools:**
- **ESLint** - Code linting
- **Vitest** - Unit testing
- **PostCSS** - CSS processing
- **TypeScript** - Type checking

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Firebase Auth │    │   Firestore DB  │
│   (Vite)        │◄──►│   Email + Google│    │   Real-time     │
│                 │    │                 │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Vercel      │
                    │   Hosting       │
                    └─────────────────┘
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **bun** - Package manager
- **Git** - Version control
- **Firebase CLI** (optional, for advanced Firebase operations)

### Firebase Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Authentication** with Phone provider
4. Enable **Firestore Database**
5. Get your Firebase config from Project Settings

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd commute-connect
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: For development
VITE_APP_ENV=development
```

### 4. Firebase Configuration

Update `src/lib/firebase.ts` with your Firebase config:

```typescript
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

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 5. Firebase Security Rules

Set up Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Rides are publicly readable, but only creators can modify
    match /rides/{rideId} {
      allow read: if true;
      allow write: if request.auth != null && resource.data.driverId == request.auth.uid;
    }

    // Bookings: users can read their own, drivers can read for their rides
    match /bookings/{bookingId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.passengerId ||
         exists(/databases/$(database)/documents/rides/$(resource.data.rideId)) &&
         get(/databases/$(database)/documents/rides/$(resource.data.rideId)).data.driverId == request.auth.uid);
      allow write: if request.auth != null && request.auth.uid == resource.data.passengerId;
    }

    // Similar rules for other collections...
  }
}
```

## 🚀 Development

### Start Development Server

```bash
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm run test
# or watch mode
npm run test:watch
```

### Lint Code

```bash
npm run lint
```

## 📦 Deployment

For detailed deployment instructions to Firebase + Vercel, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deploy

1. Set up Firebase project with Authentication and Firestore
2. Add environment variables to Vercel
3. Deploy via Vercel dashboard or CLI

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add Firebase config variables in Vercel dashboard
3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Deploy**: Push to main branch or deploy manually

### Firebase Hosting (Alternative)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy
```

## 🗄️ Database Schema

### Firestore Collections

#### `users`
```typescript
{
  uid: string; // Firebase Auth UID
  phone: string;
  name: string;
  email?: string;
  profilePhoto?: string;
  isProfileComplete: boolean;
  role: 'passenger' | 'driver';
  homeLocation?: Location;
  officeLocation?: Location;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `drivers`
```typescript
{
  userId: string;
  vehicleId: string;
  isVerified: boolean;
  rating: number;
  totalRides: number;
  joinedAsDriverAt: Timestamp;
}
```

#### `vehicles`
```typescript
{
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  seats: number;
  createdAt: Timestamp;
}
```

#### `rides`
```typescript
{
  id: string;
  driverId: string;
  vehicleId: string;
  startLocation: Location;
  endLocation: Location;
  direction: 'to_office' | 'from_office';
  departureTime: Timestamp;
  availableSeats: number;
  totalSeats: number;
  costPerSeat: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  route?: string;
  createdAt: Timestamp;
}
```

#### `bookings`
```typescript
{
  id: string;
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  totalCost: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentMethod: 'upi' | 'card' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  bookedAt: Timestamp;
  cancelledAt?: Timestamp;
  completedAt?: Timestamp;
}
```

#### `ratings`
```typescript
{
  id: string;
  bookingId: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: Timestamp;
}
```

## 🔐 Authentication Flow

1. **Phone Number Input**: User enters phone number
2. **OTP Request**: Firebase sends OTP to phone number
3. **OTP Verification**: User enters OTP, Firebase verifies
4. **User Creation**: If new user, create profile in Firestore
5. **Session Management**: Firebase handles session persistence

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── MainLayout.tsx
│   ├── NavLink.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   ├── firebase.ts     # Firebase configuration
│   ├── firestore.ts    # Firestore operations
│   ├── utils.ts
│   └── storage.ts      # Legacy localStorage (remove after migration)
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── test/               # Test files
```

## 🔄 Migration from Demo to Production

### Code Changes Required

1. **Replace localStorage with Firestore**:
   - Update `AuthContext.tsx` to use Firebase Auth
   - Create Firestore service functions in `lib/firestore.ts`
   - Update all data operations to use Firestore instead of localStorage

2. **Authentication Updates**:
   - Implement Firebase phone authentication
   - Remove dummy OTP logic
   - Update session management

3. **Data Operations**:
   - Convert all CRUD operations to Firestore
   - Implement real-time listeners for live updates
   - Add proper error handling

### Key Files to Update

- `src/contexts/AuthContext.tsx`
- `src/lib/storage.ts` → `src/lib/firestore.ts`
- All page components that use storage functions
- Environment configuration

## 🧪 Testing

### Unit Tests
- Component testing with Vitest and React Testing Library
- Utility function testing
- Hook testing

### Integration Tests
- Authentication flow testing
- Data operation testing
- End-to-end user flows

## 🔒 Security Considerations

- **Firebase Security Rules**: Properly configured to protect user data
- **Environment Variables**: Never commit secrets to version control
- **Input Validation**: All user inputs validated with Zod schemas
- **Authentication**: Firebase handles secure authentication
- **Data Privacy**: User data protected and encrypted

## 🚀 Performance Optimization

- **Code Splitting**: Vite handles automatic code splitting
- **Image Optimization**: Use appropriate image formats and sizes
- **Caching**: Firebase and browser caching for static assets
- **Lazy Loading**: Components loaded on demand
- **Database Queries**: Optimized Firestore queries with proper indexing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add tests for new features

## 📄 License

This project is proprietary software owned by OFFICERIDES.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 📈 Future Enhancements

- **Real-time Chat**: In-app messaging between passengers and drivers
- **Route Optimization**: AI-powered route suggestions
- **Payment Integration**: Stripe/PayPal integration for payments
- **Push Notifications**: Firebase Cloud Messaging
- **Analytics**: User behavior and ride statistics
- **Admin Dashboard**: Management interface for administrators

## 🔄 Migration from Demo to Production

### ✅ Completed
- Firebase Authentication integration
- Firestore database setup
- Updated AuthContext for Firebase
- Created Firestore service layer
- Updated login/verification flow
- Environment configuration
- Deployment documentation

### 🔄 In Progress
- Update all pages to use Firestore instead of localStorage
- Implement real-time subscriptions
- Add error handling and loading states
- Update dummy data to use Firestore

### 📋 Remaining Tasks
- Replace `src/lib/storage.ts` usage in components
- Update ride creation, booking, and management pages
- Implement real-time ride updates
- Add offline support with Firestore persistence
- Update profile and driver management pages
