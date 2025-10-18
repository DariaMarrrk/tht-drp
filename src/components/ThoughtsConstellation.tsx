import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadThoughts();
    }
  }, [user]);

  const loadThoughts = async () => {
    try {
      const { data, error } = await supabase
        .from("thoughts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setThoughts(mockThoughts);
        setIsLoading(false);
        return;
      }

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
      const thoughtsWithKeywords = data.map(thought => ({
        ...thought,
        keywords: extractKeywords(thought.content),
        sentiment: (thought.sentiment as "positive" | "neutral" | "negative") || "neutral",
      }));

      // Group thoughts by sentiment with clear spatial separation
      const sentimentPositions = {
        positive: { baseX: 200, baseY: 200, maxRadius: 150 },
        neutral: { baseX: 450, baseY: 300, maxRadius: 120 },
        negative: { baseX: 700, baseY: 200, maxRadius: 150 },
      };

      // Transform thoughts with improved clustering
      const transformedThoughts: Thought[] = thoughtsWithKeywords.map((thought, index) => {
        const contentLength = thought.content.length;
        const passionLevel = Math.min(contentLength, 200) + (thought.content.match(/[!?]/g) || []).length * 20;
        const size = Math.min(Math.max(passionLevel / 5, 40), 120);
        
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
              const existingThought = transformedThoughts[otherIndex];
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
        
        return {
          id: thought.id,
          content: thought.content,
          sentiment: thought.sentiment,
          created_at: thought.created_at,
          x: sentimentPos.baseX + positionOffset.x,
          y: sentimentPos.baseY + positionOffset.y,
          size,
        };
      });

      setThoughts(transformedThoughts);
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
        return "hsl(var(--secondary))"; // Blue
      case "negative":
        return "hsl(var(--accent))"; // Purple
      case "neutral":
        return "hsl(var(--primary))"; // Purple-blue
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

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-[hsl(260_40%_12%)] to-[hsl(260_35%_8%)] relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              My Thoughts This Week
            </h2>
          </div>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Similar thoughts cluster together, while opposing emotions are kept apart. The size reflects your passion and detail.
          </p>
        </div>

        <Card className="p-8 bg-[hsl(260_35%_10%)]/80 backdrop-blur-sm border-2 border-white/10 animate-fade-in">
          <div className="relative w-full" style={{ height: "600px" }}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/70">Loading your thoughts...</p>
              </div>
            ) : thoughts.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/70">No thoughts yet. Start sharing!</p>
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

            {/* Tooltip */}
            {hoveredThought && (
              <div
                className="absolute bg-card/95 backdrop-blur-sm border-2 border-primary/50 rounded-lg p-4 max-w-xs shadow-glow pointer-events-none z-50"
                style={{
                  left: `${(thoughts.find(t => t.id === hoveredThought)?.x || 0) / 9}%`,
                  top: `${(thoughts.find(t => t.id === hoveredThought)?.y || 0) / 6}%`,
                  transform: "translate(-50%, calc(-100% - 20px))",
                  transition: "none",
                }}
              >
                <p className="text-sm text-foreground">
                  {thoughts.find(t => t.id === hoveredThought)?.content}
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap gap-6 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getSentimentColor("positive") }} />
              <span className="text-white/80">Positive thoughts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getSentimentColor("neutral") }} />
              <span className="text-white/80">Neutral thoughts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getSentimentColor("negative") }} />
              <span className="text-white/80">Challenging thoughts</span>
            </div>
            <div className="text-white/60 ml-4">
              • Bigger circles = longer or more passionate thoughts
            </div>
          </div>
        </Card>

        <p className="text-center mt-8 text-white/50 text-sm">
          Similar thoughts cluster together • Opposing emotions stay separate • Lines connect related thoughts
        </p>
      </div>
    </section>
  );
};
