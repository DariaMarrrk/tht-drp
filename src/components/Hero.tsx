import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import heroBackground from "@/assets/hero-background.jpg";

export const Hero = () => {
  const [thought, setThought] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("thoughts")
        .insert({
          user_id: user.id,
          content: thought.trim(),
          sentiment: "neutral",
        });

      if (error) throw error;

      toast({
        title: "Thought saved",
        description: "Your thought has been captured for this week's analysis.",
      });
      setThought("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Floating Circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Thought Drop
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
          Share your thoughts throughout the week. Get AI-powered weekend suggestions tailored to help you recharge.
        </p>
        <p className="text-lg text-muted-foreground/80 mb-12 max-w-xl mx-auto">
          Your weekly mental health companion
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex gap-3 items-center bg-card/80 backdrop-blur-sm border-2 border-border rounded-full p-2 shadow-glow">
            <Input
              type="text"
              placeholder="What's on your mind?"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              disabled={isSubmitting}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg px-4"
            />
            <Button
              type="submit"
              size="lg"
              disabled={!thought.trim() || isSubmitting}
              className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};
