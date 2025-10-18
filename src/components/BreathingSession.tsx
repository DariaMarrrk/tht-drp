import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Play, Pause } from "lucide-react";

interface BreathingSessionProps {
  exercise: {
    title: string;
    duration: string;
    breathPattern: { inhale: number; hold: number; exhale: number };
    color: string;
  };
  onClose: () => void;
}

type Phase = 'inhale' | 'hold' | 'exhale';

export const BreathingSession = ({ exercise, onClose }: BreathingSessionProps) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [countdown, setCountdown] = useState(exercise.breathPattern.inhale);
  const [totalTime, setTotalTime] = useState(0);

  const durationInSeconds = parseInt(exercise.duration) * 60;

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return exercise.breathPattern.hold;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return exercise.breathPattern.exhale;
          } else {
            setPhase('inhale');
            return exercise.breathPattern.inhale;
          }
        }
        return prev - 1;
      });

      setTotalTime((prev) => {
        if (prev >= durationInSeconds) {
          setIsActive(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phase, exercise.breathPattern, durationInSeconds]);

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
    }
  };

  const getCircleScale = () => {
    switch (phase) {
      case 'inhale': return 'scale-100';
      case 'hold': return 'scale-100';
      case 'exhale': return 'scale-75';
    }
  };

  const progress = (totalTime / durationInSeconds) * 100;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-lg z-50 flex items-center justify-center p-6">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6 rounded-full"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">{exercise.title}</h2>
        <p className="text-muted-foreground mb-8">
          {Math.floor((durationInSeconds - totalTime) / 60)}:{String((durationInSeconds - totalTime) % 60).padStart(2, '0')} remaining
        </p>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full mb-12 overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${exercise.color} transition-all duration-1000`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Breathing Circle */}
        <div className="relative w-80 h-80 mx-auto mb-12">
          <div 
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${exercise.color} opacity-20 transition-transform duration-[${phase === 'inhale' ? exercise.breathPattern.inhale : phase === 'hold' ? exercise.breathPattern.hold : exercise.breathPattern.exhale}s] ease-in-out ${getCircleScale()}`}
          />
          <div 
            className={`absolute inset-8 rounded-full bg-gradient-to-br ${exercise.color} opacity-40 transition-transform duration-[${phase === 'inhale' ? exercise.breathPattern.inhale : phase === 'hold' ? exercise.breathPattern.hold : exercise.breathPattern.exhale}s] ease-in-out ${getCircleScale()}`}
          />
          <div 
            className={`absolute inset-16 rounded-full bg-gradient-to-br ${exercise.color} flex items-center justify-center transition-transform duration-[${phase === 'inhale' ? exercise.breathPattern.inhale : phase === 'hold' ? exercise.breathPattern.hold : exercise.breathPattern.exhale}s] ease-in-out ${getCircleScale()}`}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-2">{getPhaseText()}</p>
              <p className="text-5xl font-bold text-white">{countdown}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <Button
          size="lg"
          className="rounded-full px-12"
          onClick={() => setIsActive(!isActive)}
        >
          {isActive ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              {totalTime > 0 ? 'Resume' : 'Start'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
