import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Export students request received');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Create client with user's token to verify they have access
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Verify the user is authenticated and has assistant/admin role
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user has assistant_teacher or admin role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'assistant_teacher']);

    if (rolesError || !roles || roles.length === 0) {
      console.error('User does not have required role:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Access denied. Assistant or Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User has required role');

    // Fetch all profiles (excluding the current user - staff member)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, phone, academic_year, language_track, attendance_mode, created_at')
      .neq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Fetched ${profiles?.length || 0} profiles`);

    // Fetch user emails from auth.users using admin client
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    console.log(`Fetched ${authUsers?.users?.length || 0} auth users`);

    // Create a map of user_id to email
    const emailMap = new Map<string, string>();
    authUsers?.users?.forEach(u => {
      emailMap.set(u.id, u.email || '');
    });

    // Combine profiles with emails
    const studentsData = (profiles || []).map(profile => ({
      name: profile.full_name || '',
      phone: profile.phone || '',
      email: emailMap.get(profile.user_id) || '',
      academic_year: profile.academic_year || '',
      language_track: profile.language_track || '',
      attendance_mode: profile.attendance_mode || '',
      created_at: profile.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG') : '',
    }));

    console.log(`Prepared ${studentsData.length} students for export`);

    // Generate CSV content
    const headers = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'الصف الدراسي', 'المسار', 'نوع الحضور', 'تاريخ التسجيل'];
    const csvRows = [
      headers.join(','),
      ...studentsData.map(s => [
        `"${s.name}"`,
        `"${s.phone}"`,
        `"${s.email}"`,
        `"${s.academic_year === 'second_secondary' ? 'الثاني الثانوي' : s.academic_year === 'third_secondary' ? 'الثالث الثانوي' : s.academic_year}"`,
        `"${s.language_track === 'arabic' ? 'عربي' : s.language_track === 'languages' ? 'لغات' : s.language_track}"`,
        `"${s.attendance_mode === 'online' ? 'أونلاين' : s.attendance_mode === 'center' ? 'سنتر' : s.attendance_mode === 'hybrid' ? 'هجين' : s.attendance_mode}"`,
        `"${s.created_at}"`,
      ].join(','))
    ];
    
    const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Arabic support in Excel

    console.log('CSV generated successfully');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="students.csv"',
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Export error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
