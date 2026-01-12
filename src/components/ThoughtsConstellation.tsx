import { useState, useEffect, useRef } from "react";
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
import themeSnowyWinter from "@/assets/theme-snowy-winter.jpg";
import themeRainyDay from "@/assets/theme-rainy-day.jpg";
import themeForestLake from "@/assets/theme-forest-lake.jpg";

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
  const containerRef = useRef<HTMLDivElement>(null);
  // Dynamic SVG viewBox dimensions synced to actual container size
  const [vb, setVb] = useState({ w: 900, h: 600 });

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
  }, [user, weekOffset, vb.w, vb.h]);

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

      // Define non-overlapping column bounds per sentiment based on current viewBox (responsive)
      const marginX = Math.max(32, vb.w * 0.05);
      const marginY = Math.max(40, vb.h * 0.08);
      const innerW = Math.max(150, vb.w - marginX * 2);
      const colW = innerW / 3;
      const yMin = marginY;
      const yMax = vb.h - marginY;
      const groupBounds = {
        positive: { xMin: marginX + 0 * colW + 8, xMax: marginX + 1 * colW - 8, yMin, yMax, centerX: marginX + colW * 0.5, centerY: (yMin + yMax) / 2 },
        neutral:  { xMin: marginX + 1 * colW + 8, xMax: marginX + 2 * colW - 8, yMin, yMax, centerX: marginX + colW * 1.5, centerY: (yMin + yMax) / 2 },
        negative: { xMin: marginX + 2 * colW + 8, xMax: marginX + 3 * colW - 8, yMin, yMax, centerX: marginX + colW * 2.5, centerY: (yMin + yMax) / 2 },
      } as const;

      // Transform thoughts with robust, deterministic placement and collision resolution
      const positionedThoughts: Thought[] = [];

      // Seeded RNG for deterministic layout across builds
      const hashString = (str: string) => {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return h >>> 0;
      };
      const mulberry32 = (a: number) => () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

      // Distance helper with buffer
      const buffer = 18; // slightly larger than before to ensure spacing
      const circleClearance = (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy) - (r1 + r2 + buffer);
      };

      // Best-candidate sampling inside rectangular bounds
      const bestCandidateInBounds = (
        bounds: { xMin: number; xMax: number; yMin: number; yMax: number },
        radius: number,
        placed: Thought[],
        rng: () => number
      ) => {
        let best: { x: number; y: number } | null = null;
        let bestScore = -Infinity;
        const tries = 250;
        for (let i = 0; i < tries; i++) {
          const x = bounds.xMin + radius + (bounds.xMax - bounds.xMin - 2 * radius) * rng();
          const y = bounds.yMin + radius + (bounds.yMax - bounds.yMin - 2 * radius) * rng();

          let minClear = Infinity;
          for (const p of placed) {
            const c = circleClearance(x, y, radius, p.x, p.y, p.size / 2);
            if (c < minClear) minClear = c;
          }
          if (placed.length === 0) minClear = 9999;

          if (minClear > bestScore) {
            bestScore = minClear;
            best = { x, y };
          }
          if (minClear >= 0) return { x, y };
        }
        // May still return best (might be slightly overlapping; we'll resolve via relaxation)
        return best ?? { x: (bounds.xMin + bounds.xMax) / 2, y: (bounds.yMin + bounds.yMax) / 2 };
      };

      // Resolve any residual overlaps using a simple relaxation within bounds
      const resolveOverlapsInBounds = (
        items: Thought[],
        bounds: { xMin: number; xMax: number; yMin: number; yMax: number }
      ) => {
        const iterations = 120;
        for (let k = 0; k < iterations; k++) {
          let moved = false;
          for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
              const a = items[i];
              const b = items[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              let dist = Math.hypot(dx, dy) || 0.0001;
              const required = a.size / 2 + b.size / 2 + buffer;
              const overlap = required - dist;
              if (overlap > 0) {
                const ux = dx / dist;
                const uy = dy / dist;
                const push = overlap / 2 + 0.5;
                a.x -= ux * push; a.y -= uy * push;
                b.x += ux * push; b.y += uy * push;
                moved = true;
              }
            }
            // Clamp to bounds after each inner loop
            const ar = items[i].size / 2;
            items[i].x = Math.min(bounds.xMax - ar, Math.max(bounds.xMin + ar, items[i].x));
            items[i].y = Math.min(bounds.yMax - ar, Math.max(bounds.yMin + ar, items[i].y));
          }
          if (!moved) break;
        }
      };

      // Place per-group in distinct columns
      const sentiments: ("positive"|"neutral"|"negative")[] = ["positive", "neutral", "negative"];

      sentiments.forEach((sent) => {
        const bounds = groupBounds[sent];
        const groupPlaced: Thought[] = [];
        
        thoughtsWithKeywords
          .filter(t => t.sentiment === sent)
          // Place larger circles first for better packing
          .sort((a, b) => b.content.length - a.content.length)
          .forEach((thought) => {
            const contentLength = thought.content.length;
            const exclaimCount = (thought.content.match(/[!?]/g) || []).length;
            const lenScore = Math.sqrt(Math.min(contentLength, 500)) * 6;
            const emphScore = Math.min(exclaimCount * 8, 24);
            const size = Math.max(Math.min(24 + lenScore + emphScore, 100), 24);
            const radius = size / 2;

            // Deterministic RNG per thought
            const rng = mulberry32(hashString(`${thought.id}:${thought.created_at ?? ''}:${thought.content}`));

            const pos = bestCandidateInBounds(bounds, radius, groupPlaced, rng);

            const placed: Thought = {
              id: thought.id,
              content: thought.content,
              sentiment: sent,
              created_at: thought.created_at,
              x: pos.x,
              y: pos.y,
              size,
            };
            groupPlaced.push(placed);
          });

        // Final relaxation to absolutely remove overlaps
        resolveOverlapsInBounds(groupPlaced, bounds);

        // Append to master list
        positionedThoughts.push(...groupPlaced);
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

  // Generate connections between thematically related thoughts
  const generateConnections = (): [string, string][] => {
    const connections: [string, string][] = [];
    const maxDistance = 200; // Maximum distance for visual connections
    const minSimilarity = 0.25; // Minimum keyword overlap to connect (25% shared keywords)
    
    // Helper to extract keywords from text
    const extractKeywords = (text: string): Set<string> => {
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'am', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would', 'could', 'ought']);
      const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      return new Set(words.filter(w => !stopWords.has(w)));
    };
    
    // Calculate thematic similarity based on shared keywords
    const calculateSimilarity = (keywords1: Set<string>, keywords2: Set<string>): number => {
      const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
      const union = new Set([...keywords1, ...keywords2]);
      return union.size > 0 ? intersection.size / union.size : 0;
    };
    
    // Extract keywords for all thoughts
    const thoughtsWithKeywords = thoughts.map(thought => ({
      ...thought,
      keywords: extractKeywords(thought.content)
    }));
    
    thoughtsWithKeywords.forEach((thought, i) => {
      thoughtsWithKeywords.slice(i + 1).forEach((otherThought) => {
        // Must have same sentiment
        if (thought.sentiment !== otherThought.sentiment) return;
        
        // Calculate thematic similarity
        const similarity = calculateSimilarity(thought.keywords, otherThought.keywords);
        
        // Only connect if thematically related (shared keywords)
        if (similarity >= minSimilarity) {
          const distance = Math.sqrt(
            Math.pow(thought.x - otherThought.x, 2) + 
            Math.pow(thought.y - otherThought.y, 2)
          );
          
          // Also check distance to keep visualization clean
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
      case "snowy winter":
        return themeSnowyWinter;
      case "rainy day":
        return themeRainyDay;
      case "forest lake":
        return themeForestLake;
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
          <div className="flex items-center justify-between mb-3 bg-transparent">
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

          <div ref={containerRef} className="relative w-full overflow-visible" style={{ height: "400px" }}>
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
              viewBox={`0 0 ${vb.w} ${vb.h}`}
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

            {/* Tooltip with smart positioning anchored to circle */}
            {hoveredThought && (() => {
              const thought = thoughts.find(t => t.id === hoveredThought);
              if (!thought) return null;

              const container = containerRef.current;
              const cw = container?.clientWidth ?? 0;
              const ch = container?.clientHeight ?? 0;

              // SVG viewBox size
              const vbW = vb.w;
              const vbH = vb.h;

              // Compute uniform scale and letterbox offsets used by preserveAspectRatio="xMidYMid meet"
              const scale = Math.min(cw / vbW, ch / vbH) || 0;
              const renderedW = vbW * scale;
              const renderedH = vbH * scale;
              const offsetX = (cw - renderedW) / 2;
              const offsetY = (ch - renderedH) / 2;

              // Pixel position of the circle center
              const baseLeft = offsetX + thought.x * scale;
              const baseTop = offsetY + thought.y * scale;
              const rPx = (thought.size / 2) * scale; // radius in pixels
              let anchorTop = baseTop - rPx; // start anchored to circle top edge

              // Default placement: above and centered relative to anchor
              let transformX = "-50%";
              let transformY = "calc(-100% - 12px)";
              let leftAdjustPx = 0;

              // Edge-aware adjustments using pixel thresholds
              const edgeBuffer = 140; // half tooltip width approximation
              if (baseLeft < edgeBuffer) {
                transformX = "0%";
                leftAdjustPx = 12;
              } else if (cw - baseLeft < edgeBuffer) {
                transformX = "-100%";
                leftAdjustPx = -12;
              }

              const verticalBuffer = 120; // ~tooltip height
              const spaceAbove = anchorTop; // distance from top to circle top
              const spaceBelow = ch - (baseTop + rPx); // from circle bottom to container bottom

              if (spaceAbove < verticalBuffer && spaceBelow > spaceAbove) {
                // Not enough space above → place below
                anchorTop = baseTop + rPx;
                transformY = "12px";
              } else {
                // Keep above
                anchorTop = baseTop - rPx;
                transformY = "calc(-100% - 12px)";
              }

              return (
                <div
                  className="absolute bg-card/95 backdrop-blur-sm border-2 border-primary/50 rounded-lg p-4 max-w-xs shadow-glow pointer-events-none z-50"
                  style={{
                    left: `${baseLeft + leftAdjustPx}px`,
                    top: `${anchorTop}px`,
                    transform: `translate(${transformX}, ${transformY})`,
                    transition: "none",
                    maxWidth: "260px",
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                  return (
                    <Card
                      key={index}
                      className="p-8 bg-card/95 backdrop-blur-sm border-2 border-primary/30 hover:border-primary/60 transition-all duration-300 hover:shadow-glow group hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-5 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          {getActivityIcon(suggestion.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold mb-2 text-foreground">
                            {suggestion.title}
                          </h4>
                          <p className="text-base text-muted-foreground italic">
                            {suggestion.why}
                          </p>
                        </div>
                      </div>
                      <p className="text-base text-foreground/80 leading-relaxed mb-4">
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
