import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching user context for:', userId);

    // Get memories from last 3 months, ordered by relevance
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: memories, error } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .gte('last_mentioned_at', threeMonthsAgo.toISOString())
      .order('mention_count', { ascending: false })
      .order('last_mentioned_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching memories:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch memories' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build structured context
    const context: any = {
      people: {} as Record<string, any>,
      places: {} as Record<string, any>,
      events: {} as Record<string, any>,
      goals: {} as Record<string, any>,
      habits: {} as Record<string, any>,
      themes: {} as Record<string, any>,
      summary: {
        totalMemories: memories?.length || 0,
        recentPeople: 0,
        activeGoals: 0,
        recurringThemes: [] as string[],
        textSummary: '',
      }
    };

    // Process memories by type
    for (const memory of memories || []) {
      const ctx = memory.context || {};
      const daysSinceLastMention = Math.floor(
        (Date.now() - new Date(memory.last_mentioned_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const sentimentDist = memory.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 };
      const totalSentiment = sentimentDist.positive + sentimentDist.neutral + sentimentDist.negative;
      const dominantSentiment = totalSentiment > 0
        ? sentimentDist.positive > sentimentDist.negative ? 'positive' : 
          sentimentDist.negative > sentimentDist.positive ? 'negative' : 'neutral'
        : 'neutral';

      const entityInfo = {
        name: ctx.displayName || memory.entity_name,
        mentionCount: memory.mention_count,
        firstMentioned: memory.first_mentioned_at,
        lastMentioned: memory.last_mentioned_at,
        daysSinceLastMention,
        dominantSentiment,
        sentimentBreakdown: sentimentDist,
        context: ctx.description || '',
        relationship: ctx.relationship || '',
        recentSentiment: ctx.recentSentiment || '',
      };

      switch (memory.memory_type) {
        case 'person':
          context.people[memory.entity_name] = entityInfo;
          if (daysSinceLastMention < 14) context.summary.recentPeople++;
          break;
        case 'place':
          context.places[memory.entity_name] = entityInfo;
          break;
        case 'event':
          context.events[memory.entity_name] = entityInfo;
          break;
        case 'goal':
          context.goals[memory.entity_name] = entityInfo;
          context.summary.activeGoals++;
          break;
        case 'habit':
          context.habits[memory.entity_name] = entityInfo;
          break;
        case 'theme':
          context.themes[memory.entity_name] = entityInfo;
          if (memory.mention_count >= 3) {
            context.summary.recurringThemes.push(ctx.displayName || memory.entity_name);
          }
          break;
      }
    }

    // Create human-readable summary
    const summaryParts = [];
    
    if (Object.keys(context.people).length > 0) {
      const topPeople = Object.entries(context.people)
        .sort((a: any, b: any) => b[1].mentionCount - a[1].mentionCount)
        .slice(0, 3)
        .map((p: any) => p[1].name);
      summaryParts.push(`Important people: ${topPeople.join(', ')}`);
    }

    if (Object.keys(context.goals).length > 0) {
      const activeGoals = Object.entries(context.goals)
        .map((g: any) => g[1].name);
      summaryParts.push(`Active goals: ${activeGoals.join(', ')}`);
    }

    if (context.summary.recurringThemes.length > 0) {
      summaryParts.push(`Recurring themes: ${context.summary.recurringThemes.slice(0, 3).join(', ')}`);
    }

    context.summary.textSummary = summaryParts.join('. ');

    console.log(`Built context with ${context.summary.totalMemories} memories`);

    return new Response(
      JSON.stringify({ 
        success: true,
        context,
        hasMemories: (memories?.length || 0) > 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-user-context:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
