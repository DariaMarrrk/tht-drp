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
    const { thoughtId, content, sentiment, userId } = await req.json();
    
    if (!thoughtId || !content || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Extracting entities from thought:', thoughtId);

    // Call AI to extract entities
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an entity extraction expert. Extract meaningful entities from user thoughts.

Identify and categorize entities as:
- person: Names of people (Sarah, mom, Dr. Smith, boss, friend)
- place: Locations (office, gym, coffee shop, home, park)
- event: Activities/events (presentation, meeting, date, concert, trip)
- goal: Aspirations (start business, learn Spanish, get promoted, lose weight)
- habit: Recurring activities (morning walks, meditation, journaling, yoga)
- theme: Emotional/life themes (work stress, relationship issues, health concerns)

For each entity, provide:
- type: The category
- name: A normalized name (lowercase, standardized)
- displayName: How to display it to the user
- context: Brief description of this entity's role/significance
- relationship: If person, their relationship to user (friend, family, colleague, etc.)
- sentiment: How the user feels about this entity (positive, neutral, negative, mixed)

Return ONLY valid JSON array. If no entities found, return empty array [].`
          },
          {
            role: 'user',
            content: `Extract entities from this thought: "${content}"`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', aiResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to extract entities' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content;
    
    let entities = [];
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        entities = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse entities:', e);
      entities = [];
    }

    console.log(`Extracted ${entities.length} entities`);

    // Process each entity
    const linkedEntities = [];
    for (const entity of entities) {
      // Check if entity already exists
      const { data: existingMemory } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('memory_type', entity.type)
        .ilike('entity_name', entity.name)
        .maybeSingle();

      let memoryId;
      
      if (existingMemory) {
        // Update existing memory
        const newMentionCount = existingMemory.mention_count + 1;
        const sentimentDist = existingMemory.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 };
        
        if (sentiment === 'positive') sentimentDist.positive++;
        else if (sentiment === 'negative') sentimentDist.negative++;
        else sentimentDist.neutral++;

        // Merge context
        const existingContext = existingMemory.context || {};
        const newContext = {
          ...existingContext,
          ...entity.context,
          displayName: entity.displayName || existingContext.displayName,
          relationship: entity.relationship || existingContext.relationship,
          recentSentiment: entity.sentiment,
          lastMentionContent: content.substring(0, 200),
        };

        await supabase
          .from('user_memory')
          .update({
            last_mentioned_at: new Date().toISOString(),
            mention_count: newMentionCount,
            sentiment_distribution: sentimentDist,
            context: newContext,
          })
          .eq('id', existingMemory.id);

        memoryId = existingMemory.id;
        console.log(`Updated existing memory: ${entity.displayName}`);
      } else {
        // Create new memory
        const sentimentDist = { positive: 0, neutral: 0, negative: 0 };
        if (sentiment === 'positive') sentimentDist.positive++;
        else if (sentiment === 'negative') sentimentDist.negative++;
        else sentimentDist.neutral++;

        const { data: newMemory, error: insertError } = await supabase
          .from('user_memory')
          .insert({
            user_id: userId,
            memory_type: entity.type,
            entity_name: entity.name,
            context: {
              displayName: entity.displayName,
              description: entity.context,
              relationship: entity.relationship,
              sentiment: entity.sentiment,
              firstMentionContent: content.substring(0, 200),
            },
            first_mentioned_at: new Date().toISOString(),
            last_mentioned_at: new Date().toISOString(),
            mention_count: 1,
            sentiment_distribution: sentimentDist,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting memory:', insertError);
          continue;
        }

        memoryId = newMemory.id;
        console.log(`Created new memory: ${entity.displayName}`);
      }

      // Link entity to thought
      if (memoryId) {
        await supabase
          .from('thought_entities')
          .insert({
            thought_id: thoughtId,
            memory_id: memoryId,
          });
        
        linkedEntities.push({ memoryId, ...entity });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        entitiesExtracted: entities.length,
        entitiesLinked: linkedEntities.length,
        entities: linkedEntities 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-memory:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
