import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const ThoughtInput = () => {
  const [thought, setThought] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // Analyze sentiment using AI
      const { data: sentimentData, error: sentimentError } = await supabase.functions.invoke(
        'analyze-sentiment',
        {
          body: { content: thought.trim() }
        }
      );

      const sentiment = sentimentError ? 'neutral' : (sentimentData?.sentiment || 'neutral');

      // Save thought with analyzed sentiment
      const { error } = await supabase
        .from("thoughts")
        .insert({
          user_id: user.id,
          content: thought.trim(),
          sentiment: sentiment,
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
    <section id="share" className="py-24 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What's on your mind?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share your thoughts, feelings, or what happened today. No filter needed.
          </p>
        </div>

        <Card className="p-8 bg-card/50 backdrop-blur-sm border-2 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Textarea
                placeholder="Drop your thoughts here... What's been on your mind? How are you feeling? What happened today?"
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                className="min-h-[200px] resize-none text-lg border-2 focus-visible:ring-primary"
              />
              <div className="absolute bottom-4 right-4 text-sm text-muted-foreground">
                {thought.length} characters
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-glow"
                disabled={!thought.trim() || isSubmitting}
              >
                <Send className="w-5 h-5 mr-2" />
                {isSubmitting ? "Saving..." : "Drop Thought"}
              </Button>
            </div>
          </form>

          <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Your weekly analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Every Friday, our AI analyzes your week's thoughts and patterns to suggest personalized weekend activities that will help you recharge based on the kind of week you've had.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
