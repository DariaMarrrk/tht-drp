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
    const { content } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing sentiment for:', content.substring(0, 50));

    // Call Lovable AI for sentiment analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a sentiment analysis assistant. Analyze the emotional tone of the given text and classify it as exactly one of: "positive", "neutral", or "negative". Pay special attention to emotional intensity indicators: ALL CAPS (indicates strong emotion), multiple exclamation marks (!!!, shows excitement or distress), emojis (😊😢😡 reveal true feelings), and excessive punctuation (???, shows confusion or concern). These formatting cues often reveal stronger sentiment than the words alone. Respond with ONLY the single word classification, nothing else.'
          },
          {
            role: 'user',
            content: `Analyze the sentiment of this thought: "${content}"`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const sentiment = data.choices[0]?.message?.content?.trim().toLowerCase();

    console.log('Detected sentiment:', sentiment);

    // Validate sentiment
    const validSentiments = ['positive', 'neutral', 'negative'];
    const finalSentiment = validSentiments.includes(sentiment) ? sentiment : 'neutral';

    return new Response(
      JSON.stringify({ sentiment: finalSentiment }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        sentiment: 'neutral' // Fallback to neutral on error
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
