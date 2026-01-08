import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import heroBackground from "@/assets/hero-background.jpg";
import { CrisisDialog } from "@/components/CrisisDialog";

export const Hero = () => {
  const [thought, setThought] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageryTheme, setImageryTheme] = useState("space");
  const [showCrisisDialog, setShowCrisisDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadImageryTheme();
    }
  }, [user]);

  const loadImageryTheme = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("imagery_theme").eq("id", user?.id).single();

      if (error) throw error;
      if (data?.imagery_theme) {
        setImageryTheme(data.imagery_theme);
      }
    } catch (error) {
      console.error("Error loading imagery theme:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // 1) Call crisis-aware sentiment function
      const { data: sentimentData, error: sentimentError } = await supabase.functions.invoke(
        'analyze-sentiment',
        { body: { content: thought.trim() } }
      );

      const aiSentiment = sentimentError ? 'neutral' : (sentimentData?.sentiment || 'neutral');
      const serverCrisis = sentimentData?.crisisDetected === true;

      // 2) Client-side crisis fallback (regex)
      const lc = thought.trim().toLowerCase();
      const clientCrisis = /(kill myself|suicide|suicidal|end my life|want to die|better off dead|not worth living|self[-\s]?harm|hurt myself|cut myself|harm myself)/i.test(lc);

      const crisisDetected = serverCrisis || clientCrisis;
      const sentiment = crisisDetected && aiSentiment === 'neutral' ? 'negative' : aiSentiment;

      // 3) Save thought
      const { data: savedThought, error } = await supabase.from("thoughts")
        .insert({
          user_id: user.id,
          content: thought.trim(),
          sentiment,
        })
        .select()
        .single();

      if (error) throw error;

      // Extract memory entities in the background (don't wait for it)
      if (savedThought) {
        supabase.functions.invoke('extract-memory', {
          body: {
            thoughtId: savedThought.id,
            content: thought.trim(),
            sentiment,
            userId: user.id,
          }
        }).catch(error => {
          console.error('Memory extraction error:', error);
          // Don't show error to user - this is background processing
        });
      }

      // 4) UI feedback
      if (crisisDetected) {
        setShowCrisisDialog(true);
      } else {
        toast({ title: "Thought saved", description: "Thought added to the week board" });
      }
      setThought("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThemePattern = () => {
    switch (imageryTheme) {
      case "space":
        return "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--secondary) / 0.15) 0%, transparent 50%)";
      case "forest":
        return "linear-gradient(135deg, hsl(150 40% 30% / 0.1) 0%, transparent 50%), linear-gradient(45deg, hsl(120 30% 20% / 0.1) 0%, transparent 50%)";
      case "ocean":
        return "linear-gradient(180deg, hsl(200 60% 50% / 0.1) 0%, hsl(210 70% 60% / 0.05) 100%)";
      case "garden":
        return "radial-gradient(ellipse at 30% 40%, hsl(100 40% 60% / 0.1) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, hsl(340 50% 70% / 0.1) 0%, transparent 60%)";
      case "campfire":
        return "radial-gradient(ellipse at 50% 70%, hsl(30 80% 50% / 0.15) 0%, transparent 60%)";
      case "snowy winter":
        return "radial-gradient(circle at 30% 20%, hsl(200 30% 90% / 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(210 40% 85% / 0.15) 0%, transparent 50%)";
      case "rainy day":
        return "linear-gradient(180deg, hsl(220 20% 40% / 0.15) 0%, hsl(200 30% 50% / 0.1) 100%)";
      default:
        return "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%)";
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.7) 50%, hsl(var(--background) / 0.95) 100%), ${getThemePattern()}`,
          }}
        />
      </div>

      {/* Floating Circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center animate-fade-in">
        <h1 className="font-cursive text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Etheri
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Share your thoughts throughout the week. Get AI-powered weekend suggestions tailored to help you recharge.
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
        <CrisisDialog open={showCrisisDialog} onOpenChange={setShowCrisisDialog} />
      </div>
    </section>
  );
};
