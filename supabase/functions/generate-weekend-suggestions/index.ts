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
    const { thoughts } = await req.json();

    if (!thoughts || thoughts.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No thoughts provided',
          suggestions: []
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating weekend suggestions based on ${thoughts.length} thoughts...`);

    // Prepare thoughts summary for AI
    const thoughtsSummary = thoughts.map((t: any) => 
      `[${t.sentiment}] ${t.content}`
    ).join('\n');

    // Call Lovable AI for personalized suggestions
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
            content: `You are a thoughtful wellness advisor. Analyze the user's thoughts from their week and suggest 1-15 personalized weekend activities that will help them recharge based on their emotional state and experiences.

IMPORTANT: The number of suggestions should match the complexity and variety of their week:
- Simple week with few thoughts: 1-5 suggestions
- Moderate week with varied experiences: 5-10 suggestions
- Complex week with many themes: 10-15 suggestions

For each suggestion, provide:
1. A catchy title (max 50 chars)
2. A brief WHY explanation (max 80 chars) - why this suits their week
3. A detailed WHAT description (max 200 chars) - specific actionable steps or details about what they should do, tailored to their experiences
4. An activity type (one of: relaxation, social, creative, physical, mindful, adventure, reminder)

CRITICAL - REMINDER CATEGORY: If the user mentioned specific tasks, goals, or things they need to do that haven't been mentioned as completed or cancelled, include them as "reminder" type suggestions. For example:
- "Need to call mom" → reminder to call mom
- "Should fix that leaky faucet" → reminder about home repair
- "Want to start that book" → reminder to start reading
These reminders should be actionable and specific to what they mentioned.

Be specific and reference their actual experiences. If they mentioned stress about deadlines, suggest specific relaxation techniques. If they celebrated wins, suggest ways to build on that momentum.

Respond in JSON format:
{
  "summary": "Brief 1-2 sentence analysis of their week",
  "suggestions": [
    {
      "title": "Activity name",
      "why": "Why this helps based on their week",
      "description": "Specific actionable steps for this activity",
      "type": "activity_type"
    }
  ]
}

Be warm, supportive, and specific to their actual experiences.`
          },
          {
            role: 'user',
            content: `Here are my thoughts from this week:\n\n${thoughtsSummary}\n\nBased on these thoughts, what weekend activities would help me recharge?`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again in a moment.',
            suggestions: []
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'AI credits exhausted. Please add credits to continue.',
            suggestions: []
          }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content?.trim();

    console.log('AI response received');

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating weekend suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        suggestions: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
