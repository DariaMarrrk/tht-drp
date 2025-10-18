import { Card } from "@/components/ui/card";
import { Brain, Heart, Shield, Zap } from "lucide-react";

const benefits = [
  {
    icon: Brain,
    title: "Self-Awareness",
    description: "Gain insights into your emotional patterns and mental state throughout the week",
    stat: "Better understanding"
  },
  {
    icon: Heart,
    title: "Personalized Care",
    description: "Receive weekend suggestions tailored to what you actually need, not generic advice",
    stat: "Just for you"
  },
  {
    icon: Shield,
    title: "Prevent Burnout",
    description: "Catch stress patterns early and recharge intentionally before exhaustion hits",
    stat: "Stay balanced"
  },
  {
    icon: Zap,
    title: "Better Weekends",
    description: "Make the most of your time off with activities that truly restore your energy",
    stat: "Maximize recovery"
  }
];

export const Benefits = () => {
  return (
    <section id="benefits" className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Thought Drop?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your thoughts hold the key to understanding what you need. Let AI help you decode them.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={benefit.title}
                className="p-6 text-center hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 mx-auto">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">
                  {benefit.title}
                </h3>
                
                <p className="text-3xl font-bold text-primary mb-3">
                  {benefit.stat}
                </p>
                
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by AI to understand your unique patterns and needs
          </p>
        </div>
      </div>
    </section>
  );
};
