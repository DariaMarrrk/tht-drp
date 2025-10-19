import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

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
    console.log('Starting admin password reset...');

    // Create admin client with service role key
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

    // Find the admin user by username in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('username', 'admin')
      .single();

    if (profileError || !profile) {
      console.error('Error finding admin profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Admin user not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    console.log('Found admin user:', profile.id);

    // Try updating existing user first using profile.id
    let finalUserId = profile.id;
    let success = false;

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      {
        email: 'admin@etheri.app',
        email_confirm: true,
        password: 'admin123',
        user_metadata: { username: 'admin' }
      }
    );

    if (!updateError) {
      success = true;
    } else {
      console.warn('Update by profile.id failed, attempting create or find by email:', updateError.message);

      // Try to create the user
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@etheri.app',
        password: 'admin123',
        email_confirm: true,
        user_metadata: { username: 'admin' }
      });

      if (!createError && created.user) {
        finalUserId = created.user.id;
        success = true;
      } else {
        // If already exists, list users and find by email
        if (createError && String(createError.message).toLowerCase().includes('already')) {
          const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          if (!listError && list && Array.isArray(list.users)) {
            const found = list.users.find((u: any) => (u.email || '').toLowerCase() === 'admin@etheri.app');
            if (found) {
              finalUserId = found.id;
              const { error: updateAgain } = await supabaseAdmin.auth.admin.updateUserById(found.id, {
                password: 'admin123',
                email_confirm: true,
                user_metadata: { username: 'admin' }
              });
              success = !updateAgain;
            }
          }
        }
      }
    }

    // Ensure profile row points to the correct user id and admin role exists
    if (success) {
      await supabaseAdmin.from('profiles').update({ id: finalUserId } as any).eq('username', 'admin');
      await supabaseAdmin.from('user_roles').upsert(
        { user_id: finalUserId, role: 'admin' } as any,
        { onConflict: 'user_id,role' } as any
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin credentials ready: admin@etheri.app / admin123',
          userId: finalUserId,
          email: 'admin@etheri.app'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Could not set admin credentials. Please try again.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error) {
    console.error('Error in reset-admin-password function:', error);
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