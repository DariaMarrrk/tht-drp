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
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Starting user cleanup...');

    // Get all profiles except username "admin"
    const { data: profilesToDelete, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .neq('username', 'admin');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    console.log(`Found ${profilesToDelete?.length || 0} users to delete`);

    if (!profilesToDelete || profilesToDelete.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users to delete',
          deleted: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let deleted = 0;
    let failed = 0;

    // Delete each user using admin API
    for (const profile of profilesToDelete) {
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          profile.id
        );

        if (deleteError) {
          console.error(`Failed to delete user ${profile.username}:`, deleteError);
          failed++;
        } else {
          console.log(`Deleted user: ${profile.username}`);
          deleted++;
        }
      } catch (err) {
        console.error(`Error deleting user ${profile.username}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        deleted,
        failed,
        message: `Deleted ${deleted} users, ${failed} failed`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in cleanup-users function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
