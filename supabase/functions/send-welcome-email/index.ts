import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, full_name } = await req.json();

    if (!user_id || !email) {
      console.log('[send-welcome-email] Missing user_id or email');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is a student (not admin or assistant)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id);

    const isStudent = roles?.some(r => r.role === 'student');
    const isStaff = roles?.some(r => r.role === 'admin' || r.role === 'assistant_teacher');

    if (!isStudent || isStaff) {
      console.log(`[send-welcome-email] User ${user_id} is not a student, skipping welcome email`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'not_student' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const displayName = full_name || 'طالبنا العزيز';
    const platformUrl = 'https://hossamfekry.com';

    // Arabic welcome email HTML
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>أهلاً بيك في منصة حسام فكري</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                منصة حسام فكري
              </h1>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">
                لتعليم الكيمياء 🧪
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 22px; font-weight: 600;">
                أهلاً بيك 👋
              </h2>
              
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.8;">
                سعيدين بانضمامك لمنصة حسام فكري — المنصة رقم 1 في مصر لتعليم الكيمياء لطلاب الثانوية العامة.
              </p>
              
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                <p style="margin: 0 0 16px; color: #334155; font-size: 15px; font-weight: 600;">
                  هنا هتلاقي:
                </p>
                <ul style="margin: 0; padding: 0 20px; color: #475569; font-size: 15px; line-height: 2;">
                  <li>شرح واضح وبسيط</li>
                  <li>تطبيق عملي يخليك فاهم مش حافظ</li>
                  <li>نظام متابعة يساعدك تذاكر صح</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 32px; color: #475569; font-size: 16px; line-height: 1.8;">
                ابدأ رحلتك دلوقتي، واستكشف الكورسات والحصص المجانية المتاحة ليك 👇
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${platformUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
                      الدخول إلى المنصة
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center; line-height: 1.6;">
                لو عندك أي استفسار، تقدر تتواصل معانا في أي وقت.
              </p>
              <p style="margin: 12px 0 0; color: #cbd5e1; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} منصة حسام فكري لتعليم الكيمياء
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send the welcome email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'منصة حسام فكري <notifications@hossamfekry.com>',
      to: [email],
      subject: 'أهلاً بيك في منصة حسام فكري لتعليم الكيمياء 🧪',
      html: htmlContent,
    });

    if (emailError) {
      console.error('[send-welcome-email] Resend error:', emailError);
      // Don't throw - fail silently as per requirements
      return new Response(
        JSON.stringify({ success: false, error: emailError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-welcome-email] Welcome email sent to ${email}`, emailData);

    return new Response(
      JSON.stringify({ success: true, email_id: emailData?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[send-welcome-email] Error:', error);
    // Fail silently - don't block registration
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
