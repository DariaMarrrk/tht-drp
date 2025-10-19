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
            content: 'You are a sentiment analysis assistant specializing in detecting genuine emotions. Classify text as "positive", "neutral", or "negative". BE HIGHLY SENSITIVE TO BOTH POSITIVE AND NEGATIVE INDICATORS:\n\nPOSITIVE: achievements (passed test, got job, won), celebrations (yay, woohoo, yes), ALL CAPS with excitement, multiple exclamation marks (!!!, !!!!!!), happy emojis (😊🎉✨), and success language.\n\nNEGATIVE: failures (failed test, didn\'t pass, got rejected, fired), losses (lost job, breakup, death), sadness (crying, depressed, hopeless), frustration (can\'t do this, giving up, hate), worry (anxious, scared, terrified), anger (furious, pissed off), sad emojis (😢😭💔😞), words like terrible/awful/worst/horrible.\n\nNeutral should only be for truly mundane observations without emotional weight. Examples: "I passed my driving test!" = positive, "I failed my exam" = negative, "I went to the store" = neutral. Respond with ONLY the single word classification.'
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
    let finalSentiment = validSentiments.includes(sentiment) ? sentiment : 'neutral';

    // Apply heuristics to override neutral if strong indicators present
    const text = String(content);
    const lowered = text.toLowerCase();
    
    // Negative indicators
    const negativeWords = ['fail', 'failed', 'failure', 'reject', 'rejected', 'fired', 'lost', 'loss', 'death', 'died', 'cry', 'crying', 'depressed', 'depression', 'hopeless', 'hate', 'hated', 'terrible', 'awful', 'worst', 'horrible', 'anxious', 'anxiety', 'scared', 'terrified', 'fear', 'furious', 'angry', 'pissed', 'upset', 'sad', 'miserable', 'devastated', 'heartbroken', 'disappointed', 'frustrating', 'frustrated', 'giving up', 'can\'t do', 'impossible', 'never work'];
    const negativeEmojis = /[😢😭💔😞😔😟😣😖😫😩😤😠😡🤬😰😨😱🥺😥😓]/;
    const failurePatterns = [
      /(failed|didn't pass|did not pass|flunked).*(test|exam|class|course|quiz|assignment|interview)/i,
      /(got|was|been).*(rejected|fired|laid off|dumped|denied)/i,
      /(lost|losing).*(job|relationship|loved one|someone|everything)/i,
      /(can't|cannot|couldn't|won't).*(do|handle|take|bear)/i,
    ];

    const hasNegativeIndicators = 
      negativeEmojis.test(text) ||
      negativeWords.some(w => lowered.includes(w)) ||
      failurePatterns.some(re => re.test(text));

    // Positive indicators (to avoid false negatives)
    const positiveWords = ['yay','woohoo','hooray','congrats','success','awesome','great','amazing','passed','won','happy','excited'];
    const positiveEmojis = /[🎉✨🥳😊😁😄🙂👍❤️💯👏]/;
    const hasPositiveIndicators = positiveEmojis.test(text) || positiveWords.some(w => lowered.includes(w));

    if (finalSentiment === 'neutral' && hasNegativeIndicators && !hasPositiveIndicators) {
      finalSentiment = 'negative';
    }

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
