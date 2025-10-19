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

    console.log('Analyzing sentiment for:', content);

    // PRIMARY CRISIS DETECTION VIA HEURISTICS (most reliable)
    const text = String(content);
    const lowered = text.toLowerCase();
    
    const crisisWords = [
      'kill myself', 'suicide', 'suicidal', 'end my life', 'want to die', 
      'better off dead', 'not worth living', 'no reason to live', 'no point in living',
      'self harm', 'hurt myself', 'cut myself', 'cutting myself', 'harm myself'
    ];
    const severeDistressWords = [
      'cant go on', "can't go on", 'cannot go on', 'everything is hopeless', 
      'no point in anything', 'give up on life', 'end it all', 'ending it all'
    ];
    
    let crisisDetected = false;
    let crisisType = null;
    
    // Check for crisis indicators
    if (crisisWords.some(word => lowered.includes(word))) {
      crisisType = 'suicide';
      crisisDetected = true;
      console.log('CRISIS DETECTED via heuristics:', crisisType);
    } else if (severeDistressWords.some(phrase => lowered.includes(phrase))) {
      crisisType = 'severe_distress';
      crisisDetected = true;
      console.log('CRISIS DETECTED via heuristics:', crisisType);
    }

    // SECONDARY: AI sentiment analysis
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
            content: 'You are a sentiment analysis assistant specializing in detecting genuine emotions. Classify text as "positive", "neutral", or "negative". BE HIGHLY SENSITIVE TO BOTH POSITIVE AND NEGATIVE INDICATORS:\n\nPOSITIVE: achievements (passed test, got job, won), celebrations (yay, woohoo, yes), ALL CAPS with excitement, multiple exclamation marks (!!!, !!!!!!), happy emojis (😊🎉✨), and success language.\n\nNEGATIVE: failures (failed test, didn\'t pass, got rejected, fired), losses (lost job, breakup, death), sadness (crying, depressed, hopeless), frustration (can\'t do this, giving up, hate), worry (anxious, scared, terrified), anger (furious, pissed off), sad emojis (😢😭💔😞), words like terrible/awful/worst/horrible.\n\nNeutral should only be for truly mundane observations without emotional weight. Respond with ONLY the single word: positive, neutral, or negative.'
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

    console.log('AI sentiment:', sentiment);

    // Validate sentiment
    const validSentiments = ['positive', 'neutral', 'negative'];
    let finalSentiment = validSentiments.includes(sentiment) ? sentiment : 'neutral';

    // Apply sentiment heuristics
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

    const positiveWords = ['yay','woohoo','hooray','congrats','success','awesome','great','amazing','passed','won','happy','excited'];
    const positiveEmojis = /[🎉✨🥳😊😁😄🙂👍❤️💯👏]/;
    const hasPositiveIndicators = positiveEmojis.test(text) || positiveWords.some(w => lowered.includes(w));

    if (finalSentiment === 'neutral' && hasNegativeIndicators && !hasPositiveIndicators) {
      finalSentiment = 'negative';
    }
    
    // If crisis was detected, sentiment should be negative
    if (crisisDetected && finalSentiment === 'neutral') {
      finalSentiment = 'negative';
    }

    console.log('Final result - Sentiment:', finalSentiment, 'Crisis detected:', crisisDetected, 'Crisis type:', crisisType);

    return new Response(
      JSON.stringify({ 
        sentiment: finalSentiment,
        crisisDetected,
        crisisType 
      }),
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
