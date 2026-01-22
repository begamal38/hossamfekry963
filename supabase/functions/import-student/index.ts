import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated and has assistant/admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller's role using their JWT
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check caller has assistant_teacher or admin role
    const { data: roles } = await callerClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id);

    const hasPermission = roles?.some(r => 
      r.role === 'admin' || r.role === 'assistant_teacher'
    );

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Permission denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { 
      email, 
      password, 
      full_name, 
      phone, 
      academic_year, 
      language_track,
      attendance_mode,
      center_group_id 
    } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client to create user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // IMPORTANT: grade MUST be normalized (second_secondary / third_secondary)
    // The handle_new_user trigger reads 'grade' from user_metadata
    // and applies DB check constraint 'grade_valid'
    const normalizedGrade = academic_year || null; // Already in correct format

    // Create user with metadata
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        phone: phone || null,
        // CRITICAL: Send normalized grade value for handle_new_user trigger
        grade: normalizedGrade,
        academic_year: academic_year || null,
        language_track: language_track || null,
        attendance_mode: attendance_mode || 'online',
      },
    });

    if (createError) {
      console.error('Create user error:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add to center group if specified
    if (attendance_mode === 'center' && center_group_id && newUser.user) {
      try {
        await adminClient.from('center_group_members').insert({
          group_id: center_group_id,
          student_id: newUser.user.id,
          is_active: true,
        });
      } catch (groupError) {
        console.error('Failed to add to center group:', groupError);
        // Non-blocking - user is created successfully
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUser.user.id,
        email: newUser.user.email,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Import student error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
