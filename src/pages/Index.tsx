import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ThoughtInput } from "@/components/ThoughtInput";
import { ThoughtsConstellation } from "@/components/ThoughtsConstellation";
import { HowItWorks } from "@/components/HowItWorks";
import { Benefits } from "@/components/Benefits";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="fixed top-6 right-6 z-50">
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
      <div id="home">
        <Hero />
      </div>
      <div id="share">
        <ThoughtInput />
      </div>
      <div id="constellation">
        <ThoughtsConstellation />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="benefits">
        <Benefits />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
