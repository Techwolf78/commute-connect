import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./LandingPage";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.isProfileComplete) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/complete-profile', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <LandingPage />;
};

export default Index;
