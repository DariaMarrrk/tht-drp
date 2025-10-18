import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind, Clock, Sparkles } from "lucide-react";

const exercises = [
  {
    title: "Quick Reset",
    duration: "1 min",
    description: "Perfect for a quick mental refresh between tasks",
    icon: Sparkles,
    color: "from-primary to-accent",
    breathPattern: { inhale: 4, hold: 2, exhale: 4 }
  },
  {
    title: "Deep Calm",
    duration: "3 min",
    description: "Ideal for reducing stress and finding balance",
    icon: Wind,
    color: "from-secondary to-primary",
    breathPattern: { inhale: 4, hold: 4, exhale: 6 }
  },
  {
    title: "Full Restore",
    duration: "5 min",
    description: "Complete relaxation and mental clarity",
    icon: Clock,
    color: "from-accent to-secondary",
    breathPattern: { inhale: 4, hold: 7, exhale: 8 }
  }
];

interface BreathingExercisesProps {
  onSelectExercise: (exercise: typeof exercises[0]) => void;
}

export const BreathingExercises = ({ onSelectExercise }: BreathingExercisesProps) => {
  return (
    <section id="exercises" className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Practice
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select a breathing exercise based on how much time you have
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {exercises.map((exercise, index) => {
            const Icon = exercise.icon;
            return (
              <Card 
                key={exercise.title}
                className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm border-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${exercise.color} flex items-center justify-center mb-6 mx-auto animate-pulse-glow`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2 text-center">
                  {exercise.title}
                </h3>
                
                <div className="text-center mb-4">
                  <span className="inline-block px-4 py-1 rounded-full bg-muted text-sm font-medium">
                    {exercise.duration}
                  </span>
                </div>
                
                <p className="text-muted-foreground text-center mb-6">
                  {exercise.description}
                </p>
                
                <Button 
                  className="w-full rounded-full"
                  variant="outline"
                  onClick={() => onSelectExercise(exercise)}
                >
                  Begin Session
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
