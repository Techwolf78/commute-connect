import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/MainLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

// Auth Pages
import LoginPage from "./pages/LoginPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";

// Main Pages
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import FindRidesPage from "./pages/FindRidesPage";
import RideDetailsPage from "./pages/RideDetailsPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import MyRidesPage from "./pages/MyRidesPage";
import CreateRidePage from "./pages/CreateRidePage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import BecomeDriverPage from "./pages/BecomeDriverPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Profile Completion (auth required, profile not required) */}
              <Route path="/complete-profile" element={
                <ProtectedRoute requireProfileComplete={false}>
                  <CompleteProfilePage />
                </ProtectedRoute>
              } />
              
              {/* Protected Routes with Main Layout */}
              <Route element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/find-rides" element={<FindRidesPage />} />
                <Route path="/ride/:id" element={<RideDetailsPage />} />
                <Route path="/my-bookings" element={<MyBookingsPage />} />
                <Route path="/my-rides" element={<MyRidesPage />} />
                <Route path="/create-ride" element={<CreateRidePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/edit-profile" element={<EditProfilePage />} />
                <Route path="/become-driver" element={<BecomeDriverPage />} />
              </Route>
              
              {/* Redirects */}
              <Route path="/" element={<Index />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
