import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, ArrowRight, MapPin } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary p-2 rounded-lg">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">OFFICERIDES</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => navigate('/find-rides')} variant="ghost">
              Find Rides
            </Button>
            <Button onClick={() => navigate('/login')} variant="outline">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center container mx-auto px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-muted rounded-3xl -z-10"></div>
        <div className="max-w-4xl mx-auto">

          <h1 className="text-6xl font-bold text-foreground mb-6 leading-tight">
            Connect Your Commute,<br />
            <span className="text-primary">Share the Ride</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your daily commute into a shared adventure. Save money, reduce carbon footprint,
            and build meaningful connections with fellow travelers going your way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => navigate('/login')} className="text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-shadow">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/find-rides')} className="text-lg px-8 py-4">
              <MapPin className="mr-2 h-5 w-5" />
              Find a Ride
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex-shrink-0 bg-card text-card-foreground py-3 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <Car className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary">OFFICERIDES</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">About</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
            </div>
            <p className="text-muted-foreground text-xs">
              © 2026 OFFICERIDES
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;