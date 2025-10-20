import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, RefreshCw, Heart, Users, Palette, Zap, Brain, Mountain, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CrisisDialog } from "@/components/CrisisDialog";
import { useUserTheme } from "@/hooks/useUserTheme";
import themeSpace from "@/assets/theme-space.jpg";
import themeForest from "@/assets/theme-forest.jpg";
import themeOcean from "@/assets/theme-ocean.jpg";
import themeGarden from "@/assets/theme-garden.jpg";
import themeCampfire from "@/assets/theme-campfire.jpg";
import themeCoralReef from "@/assets/theme-coral-reef.jpg";
import themeCosyLibrary from "@/assets/theme-cosy-library.jpg";
import themeStarryNight from "@/assets/theme-starry-night.jpg";
import themeVillageSunrise from "@/assets/theme-village-sunrise.jpg";

interface Thought {
  id: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  size: number;
  x: number;
  y: number;
  cluster?: number;
  created_at?: string;
}

interface Suggestion {
  title: string;
  why: string;
  description: string;
  type: string;
}

interface SuggestionsData {
  summary: string;
  suggestions: Suggestion[];
}

// Mock thoughts data with different sentiments and positions
const mockThoughts: Thought[] = [
  { id: "1", content: "Had an amazing coffee with Sarah today! We laughed so much and caught up on everything. Really needed that connection.", sentiment: "positive", size: 60, x: 150, y: 200, cluster: 1 },
  { id: "2", content: "Feeling overwhelmed with the project deadline approaching. Too many things to juggle at once.", sentiment: "negative", size: 55, x: 180, y: 350, cluster: 2 },
  { id: "3", content: "Another meeting", sentiment: "neutral", size: 30, x: 400, y: 150, cluster: 3 },
  { id: "4", content: "The presentation went really well! Got great feedback from the team and client was impressed.", sentiment: "positive", size: 65, x: 600, y: 250, cluster: 1 },
  { id: "5", content: "Tired", sentiment: "negative", size: 25, x: 220, y: 450, cluster: 2 },
  { id: "6", content: "Finally finished that book I've been reading. The ending was so satisfying and made me think about a lot of things.", sentiment: "positive", size: 70, x: 750, y: 180, cluster: 1 },
  { id: "7", content: "Feeling stuck on this problem at work. Need a fresh perspective.", sentiment: "negative", size: 50, x: 300, y: 400, cluster: 2 },
  { id: "8", content: "Lunch break", sentiment: "neutral", size: 28, x: 500, y: 300, cluster: 3 },
  { id: "9", content: "Grateful", sentiment: "positive", size: 35, x: 680, y: 350, cluster: 1 },
  { id: "10", content: "Weather is nice today", sentiment: "neutral", size: 32, x: 450, y: 220, cluster: 3 },
  { id: "11", content: "Stressed about finances this month", sentiment: "negative", size: 45, x: 250, y: 500, cluster: 2 },
  { id: "12", content: "Morning walk was refreshing", sentiment: "positive", size: 40, x: 620, y: 420, cluster: 1 },
];

// Connection lines between thoughts in the same cluster
const connections = [
  ["1", "4"], ["4", "6"], ["6", "9"], ["9", "12"],
  ["2", "5"], ["2", "7"], ["7", "11"],
  ["3", "8"], ["8", "10"]
];

export const ThoughtsConstellation = () => {
  const [hoveredThought, setHoveredThought] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [showCrisisDialog, setShowCrisisDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { imageryTheme } = useUserTheme();

  const handleGetSuggestions = async () => {
    if (thoughts.length === 0) {
      toast({
        title: "No thoughts yet",
        description: "Add some thoughts first to get personalized suggestions!",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekend-suggestions', {
        body: { 
          thoughts: thoughts.map(t => ({
            content: t.content,
            sentiment: t.sentiment,
            created_at: t.created_at
          }))
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setSuggestions(data);
      toast({
        title: "Suggestions ready!",
        description: "Scroll down to see your personalized weekend activities.",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleReanalyzThoughts = async () => {
    try {
      toast({
        title: "Re-analyzing thoughts...",
        description: "This may take a moment.",
      });

      const { data, error } = await supabase.functions.invoke('reanalyze-thoughts');

      if (error) throw error;

      toast({
        title: "Re-analysis complete!",
        description: `Updated ${data.updated} thoughts. Refresh to see changes.`,
      });

      // Reload thoughts after re-analysis
      setTimeout(() => {
        loadThoughts();
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to re-analyze thoughts",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadThoughts();
    }
  }, [user, weekOffset]);

  const loadThoughts = async () => {
    try {
      // Calculate the start and end of the selected week
      const now = new Date();
      const currentDay = now.getDay();
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday + (weekOffset * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      weekEnd.setHours(0, 0, 0, 0); // Set to start of next Monday, not end of day

      const { data, error } = await supabase
        .from("thoughts")
        .select("*")
        .gte("created_at", weekStart.toISOString())
        .lt("created_at", weekEnd.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setThoughts([]);
        setIsLoading(false);
        return;
      }

      // Heuristic fallback sentiment (used only if DB sentiment is missing or neutral)
      const detectHeuristicSentiment = (text: string): "positive" | "neutral" | "negative" => {
        const t = text.toLowerCase();
        const hasCelebrationEmoji = /[🎉✨🥳😊😁😄🙂👍❤️💯👏]/.test(text);
        const exclamations = (text.match(/!/g)?.length ?? 0);
        const hasCapsEmphasis = /\b[A-Z]{3,}\b/.test(text);
        const celebratoryWords = ['yay','woohoo','hooray','yippee','congrats','congratulations','success','awesome','great','amazing','stoked','thrilled','excited','proud','happy','relieved'];
        const achievementPatterns = [
          /(passed|ace[dp]?|cleared|cracked).*(test|exam|class|course|quiz|assignment|interview)/i,
          /(got|landed|received|accepted).*(job|offer|promotion|internship|raise|admission|scholarship)/i,
          /(won|victory|beat|trophy|medal)/i,
          /(graduated|made it|finished|completed)/i,
        ];
        const negativeWords = ['tired','sad','overwhelmed','stressed','stuck','anxious','angry','bad','frustrated','failed','broke','lonely','sick'];

        const looksPositive = (
          achievementPatterns.some(re => re.test(text)) ||
          (t.includes('passed') && /(test|exam|class|course|quiz)/.test(t)) ||
          hasCelebrationEmoji ||
          celebratoryWords.some(w => t.includes(w)) ||
          exclamations >= 2 ||
          (hasCapsEmphasis && (t.includes('pass') || t.includes('yes') || t.includes('yay') || t.includes('won')))
        );

        if (looksPositive) return 'positive';
        if (negativeWords.some(w => t.includes(w))) return 'negative';
        return 'neutral';
      };

      // Helper function to extract keywords from text
      const extractKeywords = (text: string): Set<string> => {
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves']);
        const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        return new Set(words.filter(w => !stopWords.has(w)));
      };

      // Calculate similarity between two thoughts
      const calculateSimilarity = (keywords1: Set<string>, keywords2: Set<string>): number => {
        const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
        const union = new Set([...keywords1, ...keywords2]);
        return union.size > 0 ? intersection.size / union.size : 0;
      };

      // Prepare thoughts with keywords
      const thoughtsWithKeywords = data.map(thought => {
        const baseSent = (thought.sentiment as "positive" | "neutral" | "negative") || "neutral";
        const finalSent = baseSent === "neutral" ? detectHeuristicSentiment(thought.content) : baseSent;
        return {
          ...thought,
          keywords: extractKeywords(thought.content),
          sentiment: finalSent,
        } as typeof thought & { keywords: Set<string>; sentiment: "positive"|"neutral"|"negative" };
      });

      // Group thoughts by sentiment with clear spatial separation
      const sentimentPositions = {
        positive: { baseX: 200, baseY: 200, maxRadius: 150 },
        neutral: { baseX: 450, baseY: 300, maxRadius: 120 },
        negative: { baseX: 700, baseY: 200, maxRadius: 150 },
      };

      // Transform thoughts with improved clustering
      const positionedThoughts: Thought[] = [];
      
      thoughtsWithKeywords.forEach((thought, index) => {
        const contentLength = thought.content.length;
        const exclaimCount = (thought.content.match(/[!?]/g) || []).length;
        // More expressive sizing with good spread
        const lenScore = Math.sqrt(Math.min(contentLength, 500)) * 6; // 0..~134
        const emphScore = Math.min(exclaimCount * 8, 24); // up to +24
        const size = Math.max(Math.min(24 + lenScore + emphScore, 100), 24);
        
        const sentimentPos = sentimentPositions[thought.sentiment];
        
        // Find similar thoughts to cluster with
        let positionOffset = { x: 0, y: 0 };
        let maxSimilarity = 0;
        
        thoughtsWithKeywords.slice(0, index).forEach((otherThought, otherIndex) => {
          if (otherThought.sentiment === thought.sentiment) {
            const similarity = calculateSimilarity(thought.keywords, otherThought.keywords);
            if (similarity > maxSimilarity && similarity > 0.15) {
              maxSimilarity = similarity;
              // Get position of similar thought (if already positioned)
              const existingThought = positionedThoughts[otherIndex];
              if (existingThought) {
                // Position near similar thought
                const angle = Math.random() * Math.PI * 2;
                const distance = 60 + Math.random() * 40;
                positionOffset = {
                  x: existingThought.x + Math.cos(angle) * distance - sentimentPos.baseX,
                  y: existingThought.y + Math.sin(angle) * distance - sentimentPos.baseY,
                };
              }
            }
          }
        });
        
        // If no similar thought found, position randomly within sentiment cluster
        if (maxSimilarity === 0) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * sentimentPos.maxRadius;
          positionOffset = {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
          };
        }
        
        // Calculate position and clamp to keep circles within bounds
        const radius = size / 2;
        const rawX = sentimentPos.baseX + positionOffset.x;
        const rawY = sentimentPos.baseY + positionOffset.y;
        
        // Clamp positions to keep circles fully visible within 900x600 viewBox
        const clampedX = Math.max(radius, Math.min(900 - radius, rawX));
        const clampedY = Math.max(radius, Math.min(600 - radius, rawY));
        
        positionedThoughts.push({
          id: thought.id,
          content: thought.content,
          sentiment: thought.sentiment,
          created_at: thought.created_at,
          x: clampedX,
          y: clampedY,
          size,
        });
      });

      setThoughts(positionedThoughts);

    } catch (error) {
      console.error("Error loading thoughts:", error);
      setThoughts(mockThoughts);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: "positive" | "neutral" | "negative") => {
    switch (sentiment) {
      case "positive":
        return "hsl(var(--secondary))"; // Typically blue/teal in theme
      case "negative":
        return "hsl(var(--accent))"; // Softer purple for negative
      case "neutral":
      default:
        return "hsl(var(--primary))"; // Brand color
    }
  };

  const getSentimentGlow = (sentiment: "positive" | "neutral" | "negative") => {
    switch (sentiment) {
      case "positive":
        return "0 0 20px hsl(var(--secondary) / 0.6)";
      case "negative":
        return "0 0 20px hsl(var(--accent) / 0.6)";
      case "neutral":
        return "0 0 15px hsl(var(--primary) / 0.4)";
    }
  };

  // Generate connections between nearby thoughts with same sentiment
  const generateConnections = (): [string, string][] => {
    const connections: [string, string][] = [];
    const maxDistance = 150; // Maximum distance for connections
    
    thoughts.forEach((thought, i) => {
      thoughts.slice(i + 1).forEach((otherThought) => {
        // Only connect thoughts with same sentiment
        if (thought.sentiment === otherThought.sentiment) {
          const distance = Math.sqrt(
            Math.pow(thought.x - otherThought.x, 2) + 
            Math.pow(thought.y - otherThought.y, 2)
          );
          
          if (distance < maxDistance) {
            connections.push([thought.id, otherThought.id]);
          }
        }
      });
    });
    
    return connections;
  };

  const getBackgroundImage = () => {
    switch (imageryTheme) {
      case "space":
        return themeSpace;
      case "forest":
        return themeForest;
      case "ocean":
        return themeOcean;
      case "garden":
        return themeGarden;
      case "campfire":
        return themeCampfire;
      case "coral reef":
        return themeCoralReef;
      case "cosy library":
        return themeCosyLibrary;
      case "starry night":
        return themeStarryNight;
      case "village sunrise":
        return themeVillageSunrise;
      default:
        return themeSpace;
    }
  };

  const getWeekLabel = () => {
    if (weekOffset === 0) return "This Week";
    if (weekOffset === -1) return "Last Week";
    return `${Math.abs(weekOffset)} Weeks Ago`;
  };

  return (
    <section 
      className="pt-20 pb-8 px-6 relative overflow-hidden min-h-screen flex items-center"
      style={{
        backgroundImage: `url(${getBackgroundImage()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Floating background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              My Thoughts {getWeekLabel()}
            </h2>
          </div>
        </div>

        <Card className="p-4 bg-[hsl(260_35%_10%)]/80 backdrop-blur-sm border-2 border-white/10 animate-fade-in">
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="bg-card/50 backdrop-blur-sm border-primary/50 hover:bg-primary/10 text-white text-xs px-3 py-1"
            >
              ← Previous Week
            </Button>
            <span className="text-white/80 font-medium text-sm">{getWeekLabel()}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset === 0}
              className="bg-card/50 backdrop-blur-sm border-primary/50 hover:bg-primary/10 text-white disabled:opacity-50 text-xs px-3 py-1"
            >
              Next Week →
            </Button>
          </div>

          <div className="relative w-full overflow-hidden" style={{ height: "400px" }}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/70">Loading your thoughts...</p>
              </div>
            ) : thoughts.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/70 text-lg">
                  {weekOffset === 0 
                    ? "Drop a thought to start this week's dashboard" 
                    : "No thoughts for this week"}
                </p>
              </div>
            ) : (
              <>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 900 600"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Connection lines */}
              <g opacity="0.3">
                {generateConnections().map(([start, end], idx) => {
                  const startThought = thoughts.find(t => t.id === start);
                  const endThought = thoughts.find(t => t.id === end);
                  if (!startThought || !endThought) return null;
                  
                  return (
                    <line
                      key={`${start}-${end}`}
                      x1={startThought.x}
                      y1={startThought.y}
                      x2={endThought.x}
                      y2={endThought.y}
                      stroke="white"
                      strokeWidth="1"
                      className="animate-fade-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    />
                  );
                })}
              </g>

              {/* Thought circles */}
              {thoughts.map((thought, idx) => (
                <g key={thought.id}>
                  <circle
                    cx={thought.x}
                    cy={thought.y}
                    r={thought.size / 2}
                    fill={getSentimentColor(thought.sentiment)}
                    opacity={hoveredThought === thought.id ? 1 : 0.8}
                    className="cursor-pointer animate-scale-in"
                    style={{
                      filter: hoveredThought === thought.id 
                        ? getSentimentGlow(thought.sentiment)
                        : "none",
                      animationDelay: `${idx * 0.05}s`,
                      transition: "filter 0.2s ease",
                    }}
                    onMouseEnter={() => setHoveredThought(thought.id)}
                    onMouseLeave={() => setHoveredThought(null)}
                  />
                  
                  {/* Pulse animation ring */}
                  <circle
                    cx={thought.x}
                    cy={thought.y}
                    r={thought.size / 2}
                    fill="none"
                    stroke={getSentimentColor(thought.sentiment)}
                    strokeWidth="2"
                    opacity="0"
                    className="animate-pulse"
                  >
                    <animate
                      attributeName="r"
                      from={thought.size / 2}
                      to={thought.size / 2 + 10}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              ))}
            </svg>
            </>
            )}

            {/* Tooltip with smart positioning */}
            {hoveredThought && (() => {
              const thought = thoughts.find(t => t.id === hoveredThought);
              if (!thought) return null;
              
              // Convert SVG coordinates (900x600) to percentage
              const xPercent = (thought.x / 900) * 100;
              const yPercent = (thought.y / 600) * 100;
              
              // Determine tooltip position to keep it within bounds
              let transformX = "-50%"; // Default: center horizontally
              let transformY = "calc(-100% - 12px)"; // Default: above circle
              let leftAdjust = 0;
              
              // Check if too far left (would overflow)
              if (xPercent < 20) {
                transformX = "0%"; // Align to left edge of tooltip
                leftAdjust = 10; // Add small offset from edge
              }
              // Check if too far right (would overflow)
              else if (xPercent > 80) {
                transformX = "-100%"; // Align to right edge of tooltip
                leftAdjust = -10; // Add small offset from edge
              }
              
              // Check if too far up (tooltip would go off top)
              if (yPercent < 15) {
                transformY = "calc(100% + 12px)"; // Position below circle instead
              }
              
              return (
                <div
                  className="absolute bg-card/95 backdrop-blur-sm border-2 border-primary/50 rounded-lg p-4 max-w-xs shadow-glow pointer-events-none z-50"
                  style={{
                    left: `calc(${xPercent}% + ${leftAdjust}px)`,
                    top: `${yPercent}%`,
                    transform: `translate(${transformX}, ${transformY})`,
                    transition: "none",
                    maxWidth: "280px",
                  }}
                >
                  <p className="text-sm text-foreground leading-snug">
                    {thought.content}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Legend - moved to bottom of card */}
          <div className="mt-4 flex flex-wrap gap-3 justify-center items-center text-xs border-t border-white/10 pt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSentimentColor("positive") }} />
              <span className="text-white/80">Positive thoughts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSentimentColor("neutral") }} />
              <span className="text-white/80">Neutral thoughts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSentimentColor("negative") }} />
              <span className="text-white/80">Challenging thoughts</span>
            </div>
            <div className="text-white/60 ml-2">
              • Bigger circles = longer or more passionate thoughts
            </div>
          </div>
        </Card>

        {/* Buttons - moved outside card */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Button
            onClick={handleReanalyzThoughts}
            size="lg"
            variant="outline"
            className="bg-card/50 backdrop-blur-sm border-2 border-primary/50 hover:bg-primary/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-analyze All Thoughts
          </Button>
          <Button
            onClick={handleGetSuggestions}
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-glow"
            disabled={isGeneratingSuggestions || thoughts.length === 0}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {isGeneratingSuggestions ? "Generating..." : "Get Weekend Suggestions"}
          </Button>
        </div>

        {/* Bottom description */}
        <p className="text-center mt-3 text-white/50 text-xs">
          Similar thoughts cluster together  •  Opposing emotions stay separate  •  Lines connect related thoughts
        </p>

        {/* Weekend Suggestions Section */}
        {suggestions && (
          <div className="mt-16 animate-fade-in">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-2 animate-fade-in">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8 text-secondary" />
                  <h3 className="text-3xl md:text-4xl font-bold text-white">
                    Your Weekend Recharge Plan
                  </h3>
                </div>
                <p className="text-lg text-white/70 max-w-2xl mx-auto">
                  {suggestions.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.suggestions.map((suggestion, index) => {
                  const getActivityIcon = (type: string) => {
                    switch (type.toLowerCase()) {
                      case 'relaxation':
                        return <Heart className="w-6 h-6" />;
                      case 'social':
                        return <Users className="w-6 h-6" />;
                      case 'creative':
                        return <Palette className="w-6 h-6" />;
                      case 'physical':
                        return <Zap className="w-6 h-6" />;
                      case 'mindful':
                        return <Brain className="w-6 h-6" />;
                      case 'adventure':
                        return <Mountain className="w-6 h-6" />;
                      case 'reminder':
                        return <Bell className="w-6 h-6" />;
                      default:
                        return <Sparkles className="w-6 h-6" />;
                    }
                  };

                  // Check if this is a crisis-related support card
                  const isCrisisCard = /support|crisis|reach out|hotline|help|professional/i.test(
                    suggestion.title + ' ' + suggestion.description
                  );

                  return (
                    <Card
                      key={index}
                      onClick={() => isCrisisCard && setShowCrisisDialog(true)}
                      className={`p-6 bg-card/95 backdrop-blur-sm border-2 border-primary/30 hover:border-primary/60 transition-all duration-300 hover:shadow-glow group hover:-translate-y-1 ${
                        isCrisisCard ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          {getActivityIcon(suggestion.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold mb-1 text-foreground">
                            {suggestion.title}
                          </h4>
                          <p className="text-sm text-muted-foreground italic">
                            {suggestion.why}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium uppercase tracking-wide">
                          {suggestion.type}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        <CrisisDialog open={showCrisisDialog} onOpenChange={setShowCrisisDialog} />
      </div>
    </section>
  );
};
