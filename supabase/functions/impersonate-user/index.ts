import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Creating session for user: ${userId}`);

    // Generate an access token for the target user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: '', // Email will be fetched from the user
      options: {
        redirectTo: `${supabaseUrl}/auth/v1/verify`,
      }
    });

    if (error) {
      console.error('Error generating link:', error);
      
      // Alternative approach: Create a session directly
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) throw userError;
      if (!userData?.user?.email) throw new Error('User email not found');

      // Generate a magic link for the user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.user.email,
      });

      if (linkError) throw linkError;

      return new Response(
        JSON.stringify({ 
          success: true,
          actionUrl: linkData.properties?.action_link,
          message: 'Impersonation link generated'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        actionUrl: data.properties?.action_link,
        message: 'Impersonation link generated'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in impersonate-user function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
