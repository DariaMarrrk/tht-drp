import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

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

    // Find the user with username 'account'
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', 'account')
      .single();

    if (profileError || !profile) {
      throw new Error('Account user not found');
    }

    // Update username to 'admin'
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: 'admin' })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    // Fetch the admin avatar from the local file system
    // Note: In production, you'd need to handle this differently
    // For now, we'll return success and the user will need to upload the avatar manually
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Username updated to admin. Please upload the admin avatar from src/assets/admin-avatar.png',
        userId: profile.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error);
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
