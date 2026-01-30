# Commute Connect - Deployment Guide

This guide will help you deploy the Commute Connect ride-sharing application to production using Firebase and Vercel.

## Prerequisites

- Firebase account (no billing required - using free Email/Password and Google authentication)
- Google Cloud Console access (for Google Sign-In configuration)
- Vercel account
- Node.js 18+ installed locally
- Git repository

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enter project name: `commute-connect-prod`
4. Enable Google Analytics (optional but recommended)
5. Choose default settings and create project

### 1.2 Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Go to **Sign-in method** tab
3. Enable **Email/Password** provider
4. Enable **Google** provider:
   - Click on Google provider
   - Enter your project name (e.g., "Commute Connect")
   - Click "Save"
5. Configure authorized domains (add your Vercel domain later)

### 1.2.1 Configure Google OAuth (Required for Google Sign-In)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if needed)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
5. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: Commute Connect
   - User support email: Your email
   - Developer contact: Your email
6. For Application type, select **Web application**
7. Add authorized redirect URIs:
   - `https://commute-connect-prod.firebaseapp.com/__/auth/handler`
   - Add your Vercel domain later: `https://your-app.vercel.app/__/auth/handler`
8. Copy the Client ID and Client Secret (you'll need these for Firebase)

### 1.3 Enable Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (you can configure security rules later)
3. Select a location (choose one close to your users)

### 1.4 Get Firebase Configuration

1. Go to **Project settings** (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" → Web app (</>) icon
4. Register app with name "Commute Connect"
5. Copy the Firebase config object - you'll need this for environment variables

### 1.5 Configure Firestore Security Rules

Go to **Firestore Database** → **Rules** and update with:

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

    // Drivers: only the driver can read/write their data
    match /drivers/{driverId} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }

    // Vehicles: only the owner can read/write
    match /vehicles/{vehicleId} {
      allow read, write: if request.auth != null && resource.data.driverId == request.auth.uid;
    }

    // Ratings: read/write based on booking permissions
    match /ratings/{ratingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        exists(/databases/$(database)/documents/bookings/$(resource.data.bookingId)) &&
        get(/databases/$(database)/documents/bookings/$(resource.data.bookingId)).data.passengerId == request.auth.uid;
    }

    // Payments: users can read their own payment data
    match /payments/{paymentId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Step 2: Environment Configuration

### 2.1 Create Environment File

Create `.env.local` in your project root:

```env
# Firebase Configuration (from Step 1.4)
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=commute-connect-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=commute-connect-prod
VITE_FIREBASE_STORAGE_BUCKET=commute-connect-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# App Configuration
VITE_APP_ENV=production
```

### 2.2 Update Authorized Domains in Firebase

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your Vercel domain (e.g., `commute-connect.vercel.app`)
3. Add `localhost` for local development

## Step 3: Vercel Deployment

### 3.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.2 Add Environment Variables

In Vercel project settings → **Environment Variables**, add:

```
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=commute-connect-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=commute-connect-prod
VITE_FIREBASE_STORAGE_BUCKET=commute-connect-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_APP_ENV=production
```

### 3.3 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Step 4: Post-Deployment Configuration

### 4.1 Update Firebase Authorized Domains

Add your Vercel domain to Firebase Authentication authorized domains.

### 4.1.1 Update Google OAuth Redirect URIs

After deployment, update your Google Cloud Console OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel domain to authorized redirect URIs:
   - `https://your-app.vercel.app/__/auth/handler`
5. Save changes

### 4.2 Test Authentication

1. Visit your deployed app
2. Try **Email/Password registration** and login
3. Try **Google Sign-In** (ensure popup windows are allowed)
4. Verify user profiles are created correctly for both methods

### 4.3 Test Firestore

1. Create a test user account
2. Try creating a ride
3. Test booking functionality

## Step 5: Production Optimization

### 5.1 Enable Firebase Security Rules

Update Firestore rules from "test mode" to production rules as configured in Step 1.5.

### 5.2 Set Up Monitoring

1. **Firebase Analytics**: Monitor user engagement
2. **Firebase Crashlytics**: Monitor app crashes (if you add native apps later)
3. **Vercel Analytics**: Monitor performance

### 5.3 Configure Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update Firebase authorized domains with custom domain

## Troubleshooting

### Authentication Issues

- **Google Sign-In popup blocked**: Ensure popup windows are allowed in browser
- **Invalid OAuth access token**: Check Google Cloud Console OAuth configuration and authorized redirect URIs
- **Email/password auth fails**: Verify Email/Password provider is enabled in Firebase
- **Domain not authorized**: Add your Vercel domain to Firebase Authentication authorized domains

### Firestore Issues

- **Permission denied**: Check security rules configuration
- **Data not saving**: Verify Firebase config variables are correct

### Build Issues

- **Environment variables not found**: Ensure VITE_ prefix for client-side variables
- **Firebase import errors**: Verify Firebase package is installed

## Security Checklist

- ✅ Firebase security rules configured
- ✅ Environment variables not committed to git
- ✅ Authorized domains configured
- ✅ Email/Password authentication enabled
- ✅ Google Sign-In configured with OAuth credentials
- ✅ Firestore database created
- ✅ Production build tested locally

## Cost Estimation

### Firebase Costs (Free Tier Limits)
- **Authentication**: 10,000 verifications/month free (Email/Password + Google Sign-In)
- **Firestore**: 1GB storage, 50,000 reads/day free
- **No billing required** for authentication (unlike Phone auth)

### Vercel Costs
- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for commercial use

## Next Steps

1. **Add Error Boundaries**: Implement React error boundaries
2. **Add Logging**: Integrate error logging service
3. **Add Analytics**: Track user behavior
4. **Add Push Notifications**: Firebase Cloud Messaging
5. **Add Payment Integration**: Stripe/PayPal for ride payments
6. **Add Admin Dashboard**: Management interface

## Support

For issues:
1. Check Firebase Console for errors
2. Check Vercel deployment logs
3. Review browser console for client-side errors
4. Check network tab for API failures

---

**Note**: This guide assumes you have basic knowledge of Firebase, Vercel, and React. For detailed Firebase documentation, visit [Firebase Docs](https://firebase.google.com/docs).