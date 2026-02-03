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
    // SSOT Brand colors - Indigo Blue (HSL 209 56% 46%) matching platform design system
    const brandPrimary = '#3173B8'; // Primary Indigo Blue
    const brandPrimaryDark = '#1e5a9e';
    const brandLight = '#f8fafc';
    const textDark = '#1e293b';
    const textMuted = '#64748b';

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>أهلاً بيك في منصة حسام فكري</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f1f5f9; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandPrimaryDark} 100%); padding: 28px 24px; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                منصة حسام فكري لتعليم الكيمياء 🧪
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 32px 32px;">
              <!-- Greeting -->
              <h1 style="margin: 0 0 20px; color: ${textDark}; font-size: 26px; font-weight: 700; line-height: 1.4;">
                أهلاً بيك 👋
              </h1>
              
              <!-- Intro Text -->
              <p style="margin: 0 0 28px; color: ${textDark}; font-size: 16px; line-height: 1.9;">
                سعيدين بانضمامك لـ<strong style="color: ${brandPrimary};">منصة حسام فكري</strong><br>
                المنصة رقم 1 في مصر لتعليم الكيمياء لطلاب الثانوية العامة.
              </p>
              
              <!-- Features Box -->
              <table role="presentation" style="width: 100%; background-color: ${brandLight}; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px; color: ${textDark}; font-size: 15px; font-weight: 600;">
                      هنا هتلاقي:
                    </p>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; color: ${textDark}; font-size: 15px; line-height: 1.6;">
                          <span style="color: ${brandPrimary}; font-weight: bold;">✔</span>&nbsp;&nbsp;شرح واضح وبسيط
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: ${textDark}; font-size: 15px; line-height: 1.6;">
                          <span style="color: ${brandPrimary}; font-weight: bold;">✔</span>&nbsp;&nbsp;تطبيق عملي يخليك فاهم مش حافظ
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: ${textDark}; font-size: 15px; line-height: 1.6;">
                          <span style="color: ${brandPrimary}; font-weight: bold;">✔</span>&nbsp;&nbsp;نظام متابعة يساعدك تذاكر بثقة
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Text -->
              <p style="margin: 0 0 24px; color: ${textDark}; font-size: 16px; line-height: 1.8; text-align: center;">
                ابدأ رحلتك التعليمية دلوقتي،<br>
                واستكشف الكورسات والحصص المجانية المتاحة ليك 👇
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${platformUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandPrimaryDark} 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 17px; font-weight: 600; box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);">
                      دخول المنصة
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px; color: ${textMuted}; font-size: 13px; line-height: 1.6;">
                لو عندك أي استفسار، تواصل معانا في أي وقت.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
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
    // SSOT: Unified email sender - FollowUp@hossamfekry.com for ALL platform emails
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Hossam Fekry Platform <FollowUp@hossamfekry.com>',
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
