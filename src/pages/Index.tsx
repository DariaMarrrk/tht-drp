import { useState } from "react";
import { Hero } from "@/components/Hero";
import { BreathingExercises } from "@/components/BreathingExercises";
import { BreathingSession } from "@/components/BreathingSession";
import { Benefits } from "@/components/Benefits";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  return (
    <div className="min-h-screen">
      <Hero />
      <BreathingExercises onSelectExercise={setSelectedExercise} />
      <Benefits />
      <Footer />
      
      {selectedExercise && (
        <BreathingSession 
          exercise={selectedExercise} 
          onClose={() => setSelectedExercise(null)} 
        />
      )}
    </div>
  );
};

export default Index;
