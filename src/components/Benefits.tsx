import { Card } from "@/components/ui/card";
import { Brain, Heart, Shield, Zap } from "lucide-react";

const benefits = [
  {
    icon: Brain,
    title: "Reduced Stress",
    description: "Lower cortisol levels and activate your body's relaxation response in minutes",
    stat: "64% reduction"
  },
  {
    icon: Heart,
    title: "Better Focus",
    description: "Improve concentration and mental clarity by calming an overactive mind",
    stat: "2x improvement"
  },
  {
    icon: Shield,
    title: "Lower Anxiety",
    description: "Regulate your nervous system and reduce feelings of worry and tension",
    stat: "58% decrease"
  },
  {
    icon: Zap,
    title: "More Energy",
    description: "Increase oxygen flow and boost natural energy without stimulants",
    stat: "40% increase"
  }
];

export const Benefits = () => {
  return (
    <section id="benefits" className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The Science of Breathing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Controlled breathing activates your parasympathetic nervous system, creating real physiological changes
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
            Based on research from Harvard Medical School, Mayo Clinic, and peer-reviewed studies
          </p>
        </div>
      </div>
    </section>
  );
};
