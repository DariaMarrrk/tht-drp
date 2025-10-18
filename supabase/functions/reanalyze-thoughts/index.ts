const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Get all thoughts
    const thoughtsResponse = await fetch(`${supabaseUrl}/rest/v1/thoughts?select=id,content`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!thoughtsResponse.ok) {
      throw new Error('Failed to fetch thoughts');
    }

    const thoughts = await thoughtsResponse.json();
    console.log(`Re-analyzing ${thoughts.length} thoughts...`);

    let updated = 0;
    let failed = 0;

    // Analyze each thought
    for (const thought of thoughts) {
      try {
        // Call AI for sentiment analysis
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a sentiment analysis assistant. Analyze the emotional tone of the given text and classify it as exactly one of: "positive", "neutral", or "negative". Respond with ONLY the single word classification, nothing else.'
              },
              {
                role: 'user',
                content: `Analyze the sentiment of this thought: "${thought.content}"`
              }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`Failed to analyze thought ${thought.id}`);
          failed++;
          continue;
        }

        const data = await aiResponse.json();
        const sentiment = data.choices[0]?.message?.content?.trim().toLowerCase();

        // Validate sentiment
        const validSentiments = ['positive', 'neutral', 'negative'];
        const finalSentiment = validSentiments.includes(sentiment) ? sentiment : 'neutral';

        // Update thought
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/thoughts?id=eq.${thought.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ sentiment: finalSentiment }),
        });

        if (!updateResponse.ok) {
          console.error(`Failed to update thought ${thought.id}`);
          failed++;
        } else {
          console.log(`Updated thought ${thought.id} with sentiment: ${finalSentiment}`);
          updated++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing thought ${thought.id}:`, error);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        total: thoughts.length,
        updated,
        failed,
        message: `Re-analyzed ${updated} thoughts successfully, ${failed} failed`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error re-analyzing thoughts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
