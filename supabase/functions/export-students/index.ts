import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CSV headers (always included even if no data)
const CSV_HEADERS = ['الاسم', 'رقم الهاتف', 'البريد الإلكتروني', 'الصف الدراسي', 'المسار', 'نوع الحضور', 'المحافظة', 'تاريخ التسجيل'];

// Helper to safely escape CSV values
function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // Escape quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

// Helper to translate values to Arabic
function translateValue(type: string, value: string | null | undefined): string {
  if (!value) return '';
  
  const translations: Record<string, Record<string, string>> = {
    academic_year: {
      'second_secondary': 'الثاني الثانوي',
      'third_secondary': 'الثالث الثانوي',
    },
    language_track: {
      'arabic': 'عربي',
      'languages': 'لغات',
    },
    attendance_mode: {
      'online': 'أونلاين',
      'center': 'سنتر',
      'hybrid': 'هجين',
    },
  };
  
  return translations[type]?.[value] || value;
}

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
        JSON.stringify({ error: 'NO_AUTH', message: 'يجب تسجيل الدخول للتصدير' }),
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

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'AUTH_FAILED', message: 'فشل التحقق من الهوية' }),
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

    if (rolesError) {
      console.error('Error checking roles:', rolesError);
      return new Response(
        JSON.stringify({ error: 'ROLE_CHECK_FAILED', message: 'خطأ في التحقق من الصلاحيات' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roles || roles.length === 0) {
      console.error('User does not have required role');
      return new Response(
        JSON.stringify({ error: 'PERMISSION_DENIED', message: 'ليس لديك صلاحية التصدير. يجب أن تكون مساعد مدرس أو مدير.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User has required role:', roles.map(r => r.role).join(', '));

    // First get all student user_ids
    const { data: studentRoles, error: studentRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (studentRolesError) {
      console.error('Error fetching student roles:', studentRolesError);
      return new Response(
        JSON.stringify({ error: 'FETCH_FAILED', message: 'خطأ في جلب بيانات الطلاب' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const studentUserIds = (studentRoles || []).map(r => r.user_id);
    console.log(`Found ${studentUserIds.length} student role entries`);

    // If no students, return empty CSV with headers
    if (studentUserIds.length === 0) {
      console.log('No students found, returning empty CSV with headers');
      const csvContent = '\uFEFF' + CSV_HEADERS.join(',');
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="students.csv"',
        },
      });
    }

    // Fetch profiles for students only (exclude current user who is staff)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, phone, academic_year, language_track, attendance_mode, governorate, created_at')
      .in('user_id', studentUserIds)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'FETCH_FAILED', message: 'خطأ في جلب بيانات الملفات الشخصية' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetched ${profiles?.length || 0} student profiles`);

    // If no profiles found, return empty CSV with headers
    if (!profiles || profiles.length === 0) {
      console.log('No student profiles found, returning empty CSV with headers');
      const csvContent = '\uFEFF' + CSV_HEADERS.join(',');
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="students.csv"',
        },
      });
    }

    // Fetch user emails from auth.users using admin client
    // Use pagination to handle large user lists
    let allAuthUsers: Array<{ id: string; email: string | undefined }> = [];
    let page = 1;
    const perPage = 1000;
    
    try {
      while (true) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });
        
        if (authError) {
          console.error('Error fetching auth users page', page, ':', authError);
          break;
        }
        
        if (!authData?.users || authData.users.length === 0) break;
        
        allAuthUsers = allAuthUsers.concat(authData.users.map(u => ({ id: u.id, email: u.email })));
        
        if (authData.users.length < perPage) break;
        page++;
      }
    } catch (authFetchError) {
      console.warn('Warning: Could not fetch all auth users, emails may be incomplete:', authFetchError);
    }

    console.log(`Fetched ${allAuthUsers.length} auth users for email lookup`);

    // Create a map of user_id to email
    const emailMap = new Map<string, string>();
    allAuthUsers.forEach(u => {
      emailMap.set(u.id, u.email || '');
    });

    // Generate CSV rows - memory efficient, process one at a time
    const csvRows: string[] = [CSV_HEADERS.join(',')];
    
    for (const profile of profiles) {
      const row = [
        escapeCSV(profile.full_name),
        escapeCSV(profile.phone),
        escapeCSV(emailMap.get(profile.user_id)),
        escapeCSV(translateValue('academic_year', profile.academic_year)),
        escapeCSV(translateValue('language_track', profile.language_track)),
        escapeCSV(translateValue('attendance_mode', profile.attendance_mode)),
        escapeCSV(profile.governorate),
        escapeCSV(profile.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG') : ''),
      ];
      csvRows.push(row.join(','));
    }
    
    const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Arabic support in Excel

    console.log(`CSV generated successfully with ${profiles.length} student(s)`);

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="students_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Export error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', message: 'حدث خطأ في الخادم أثناء التصدير' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
