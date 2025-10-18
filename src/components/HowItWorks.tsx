import { Card } from "@/components/ui/card";
import { MessageSquare, Calendar, Brain, Sparkles } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Share Your Thoughts",
    description: "Drop your thoughts anytime during the week. No structure needed—just what's on your mind.",
    color: "from-primary to-accent"
  },
  {
    icon: Calendar,
    title: "Throughout the Week",
    description: "Keep sharing as often as you like. Capture moments, feelings, wins, or challenges.",
    color: "from-secondary to-primary"
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Every Friday, our AI analyzes your patterns, emotional trends, and the overall tone of your week.",
    color: "from-accent to-secondary"
  },
  {
    icon: Sparkles,
    title: "Weekend Suggestions",
    description: "Receive personalized activity recommendations designed to help you recharge based on your unique week.",
    color: "from-primary to-secondary"
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A simple weekly routine for better mental wellbeing
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={step.title}
                className="p-6 text-center hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative mb-6">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto animate-pulse-glow`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-3">
                  {step.title}
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
