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
                content: 'You are a sentiment analysis assistant specializing in detecting genuine emotions. Classify text as "positive", "neutral", or "negative". BE HIGHLY SENSITIVE TO BOTH POSITIVE AND NEGATIVE INDICATORS:\n\nPOSITIVE: achievements (passed test, got job, won), celebrations (yay, woohoo, yes), ALL CAPS with excitement, multiple exclamation marks (!!!, !!!!!!), happy emojis (😊🎉✨), and success language.\n\nNEGATIVE: failures (failed test, didn\'t pass, got rejected, fired), losses (lost job, breakup, death), sadness (crying, depressed, hopeless), frustration (can\'t do this, giving up, hate), worry (anxious, scared, terrified), anger (furious, pissed off), sad emojis (😢😭💔😞), words like terrible/awful/worst/horrible.\n\nNeutral should only be for truly mundane observations without emotional weight. Examples: "I passed my driving test!" = positive, "I failed my exam" = negative, "I went to the store" = neutral. Respond with ONLY the single word classification.'
              },
              { role: 'user', content: 'Analyze the sentiment of this thought: "I passed my driving test!"' },
              { role: 'assistant', content: 'positive' },
              { role: 'user', content: 'Analyze the sentiment of this thought: "YAY!! I PASSED ALL MY EXAMS!!!!!!!"' },
              { role: 'assistant', content: 'positive' },
              { role: 'user', content: 'Analyze the sentiment of this thought: "I went to the store."' },
              { role: 'assistant', content: 'neutral' },
              { role: 'user', content: 'Analyze the sentiment of this thought: "I failed the exam."' },
              { role: 'assistant', content: 'negative' },
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

        // Validate and adjust with heuristics
        const validSentiments = ['positive', 'neutral', 'negative'] as const;
        let finalSentiment: 'positive' | 'neutral' | 'negative' = (validSentiments as readonly string[]).includes((sentiment as any)) ? (sentiment as any) : 'neutral';

        const text = String(thought.content);
        const lowered = text.toLowerCase();
        const isNegatedAchievement = /(did\s+not|didn't|not)\s+(pass|get|win|accept|graduate|finish|complete)/i.test(text);
        const hasCelebrationEmoji = /[🎉✨🥳😊😁😄🙂👍❤️💯👏]/.test(text);
        const celebratoryWords = ['yay','woohoo','hooray','yippee','congrats','congratulations','success','awesome','great','amazing','stoked','thrilled','excited','proud','happy','relieved'];
        const achievementPatterns = [
          /(passed|ace[dp]?|cleared|cracked).*(test|exam|class|course|quiz|assignment|interview)/i,
          /(got|landed|received|accepted).*(job|offer|promotion|internship|raise|admission|scholarship)/i,
          /(won|victory|beat|trophy|medal)/i,
          /(graduated|made it|finished|completed)/i,
        ];
        const exclamations = (text.match(/!/g)?.length ?? 0);
        const hasCapsEmphasis = /\b[A-Z]{3,}\b/.test(text);

        const looksPositive = !isNegatedAchievement && (
          hasCelebrationEmoji ||
          celebratoryWords.some(w => lowered.includes(w)) ||
          achievementPatterns.some(re => re.test(text)) ||
          (lowered.includes('passed') && /(test|exam|class|course|quiz)/.test(lowered)) ||
          exclamations >= 2 ||
          (hasCapsEmphasis && (lowered.includes('pass') || lowered.includes('yes') || lowered.includes('yay') || lowered.includes('won')))
        );

        // Negative indicators
        const negativeWords = ['fail', 'failed', 'failure', 'reject', 'rejected', 'fired', 'lost', 'loss', 'death', 'died', 'cry', 'crying', 'depressed', 'depression', 'hopeless', 'hate', 'hated', 'terrible', 'awful', 'worst', 'horrible', 'anxious', 'anxiety', 'scared', 'terrified', 'fear', 'furious', 'angry', 'pissed', 'upset', 'sad', 'miserable', 'devastated', 'heartbroken', 'disappointed', 'frustrating', 'frustrated', 'giving up', 'can\'t do', 'impossible', 'never work'];
        const negativeEmojis = /[😢😭💔😞😔😟😣😖😫😩😤😠😡🤬😰😨😱🥺😥😓]/;
        const failurePatterns = [
          /(failed|didn't pass|did not pass|flunked).*(test|exam|class|course|quiz|assignment|interview)/i,
          /(got|was|been).*(rejected|fired|laid off|dumped|denied)/i,
          /(lost|losing).*(job|relationship|loved one|someone|everything)/i,
          /(can't|cannot|couldn't|won't).*(do|handle|take|bear)/i,
        ];

        const looksNegative = 
          negativeEmojis.test(text) ||
          negativeWords.some(w => lowered.includes(w)) ||
          failurePatterns.some(re => re.test(text));

        if (finalSentiment === 'neutral' && looksPositive) {
          finalSentiment = 'positive';
        } else if (finalSentiment === 'neutral' && looksNegative && !looksPositive) {
          finalSentiment = 'negative';
        }

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
