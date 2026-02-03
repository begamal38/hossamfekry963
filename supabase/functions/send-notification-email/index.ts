import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  notification_id?: string;
  target_type?: "all" | "course" | "lesson" | "user" | "grade" | "attendance_mode";
  target_value?: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: string;
  // For direct student targeting
  student_ids?: string[];
  course_id?: string;
}

// SSOT: Unified email sender for ALL platform communications
const EMAIL_FROM = "Hossam Fekry Platform <FollowUp@hossamfekry.com>";

const generateEmailHtml = (title: string, title_ar: string, message: string, message_ar: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title_ar}</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
      margin: 0; 
      padding: 0; 
      background-color: #f5f5f5; 
      direction: rtl;
    }
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      background: white; 
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #3173B8, #1e5a9e); /* SSOT: Primary Indigo Blue */
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 26px; 
      font-weight: bold;
    }
    .content { 
      padding: 30px; 
    }
    .message-box { 
      direction: rtl; 
      text-align: right; 
      padding: 25px; 
      background: #f8fafc; 
      border-radius: 10px;
      border-right: 4px solid #3173B8;
    }
    .message-box h2 { 
      color: #3173B8; 
      margin: 0 0 15px 0;
      font-size: 22px;
    }
    .message-box p { 
      line-height: 1.8; 
      color: #334155; 
      margin: 0;
      font-size: 16px;
    }
    .footer { 
      background: #e2e8f0; 
      padding: 20px; 
      text-align: center; 
      font-size: 13px; 
      color: #64748b; 
    }
    .footer p { margin: 5px 0; }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>منصة حسام فكري التعليمية</h1>
    </div>
    <div class="content">
      <div class="message-box">
        <h2>${title_ar}</h2>
        <p>${message_ar}</p>
      </div>
    </div>
    <div class="footer">
      <p>Hossam Fekry Educational Platform</p>
      <p>هذا إشعار تلقائي - لا ترد على هذا البريد</p>
    </div>
  </div>
</body>
</html>
`;

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - email notifications disabled");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email notifications not configured. Notification saved to platform only.",
          emails_sent: 0 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData = await req.json();
    const { 
      notification_id,
      target_type, 
      target_value, 
      title, 
      title_ar, 
      message, 
      message_ar,
      type,
      student_ids,
      course_id,
      test_email
    } = requestData;

    console.log(`[send-notification-email] Request received:`, {
      target_type,
      target_value,
      student_ids_count: student_ids?.length,
      has_test_email: !!test_email
    });

    // Direct test mode - send to specific email without database lookup
    if (test_email) {
      console.log(`[Test Mode] Sending test email to: ${test_email}`);
      
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [test_email],
          subject: title_ar,
          html: generateEmailHtml(title, title_ar, message, message_ar),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Test Mode] Email sent successfully:`, data);
        return new Response(
          JSON.stringify({ success: true, emails_sent: 1, test_mode: true, email_id: data.id }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        const errorData = await response.json();
        console.error(`[Test Mode] Email failed:`, errorData);
        return new Response(
          JSON.stringify({ success: false, error: errorData.message }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Get target users based on targeting
    let userIds: string[] = [];

    // First, get all assistant teachers and admins to exclude them from ALL notifications
    const { data: staffRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["assistant_teacher", "admin"]);
    
    const staffUserIds = new Set((staffRoles || []).map(r => r.user_id));

    // If direct student_ids provided (from SendNotifications for individual targeting)
    if (student_ids && student_ids.length > 0) {
      // Filter out any staff that might have been included
      userIds = student_ids.filter((id: string) => !staffUserIds.has(id));
      console.log(`[send-notification-email] Using provided student_ids (after staff filter): ${userIds.length} students`);
    } else {
      // staffUserIds already fetched above

      if (target_type === "all") {
        // Get all student users (excluding staff)
        const { data: studentRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "student");
        
        userIds = (studentRoles || [])
          .map(r => r.user_id)
          .filter(id => !staffUserIds.has(id));
      } else if (target_type === "user" && target_value) {
        // Only include if not staff
        if (!staffUserIds.has(target_value)) {
          userIds = [target_value];
        }
      } else if (target_type === "course" && (target_value || course_id)) {
        // Get users enrolled in the course (excluding staff)
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("user_id")
          .eq("course_id", target_value || course_id);
        
        userIds = (enrollments || [])
          .map(e => e.user_id)
          .filter(id => !staffUserIds.has(id));
      } else if (target_type === "grade" && target_value) {
        // Get users in specific grade (excluding staff)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("grade", target_value);
        
        userIds = (profiles || [])
          .map(p => p.user_id)
          .filter(id => !staffUserIds.has(id));
      } else if (target_type === "attendance_mode" && target_value) {
        // Get users with specific attendance mode (excluding staff)
        // Handle legacy 'hybrid' mode by treating it as 'online'
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, attendance_mode");
        
        // Filter based on normalized attendance mode
        userIds = (profiles || [])
          .filter(p => {
            if (!p.attendance_mode) return false;
            // Legacy hybrid is treated as online
            const normalizedMode = p.attendance_mode === 'hybrid' ? 'online' : p.attendance_mode;
            return normalizedMode === target_value;
          })
          .map(p => p.user_id)
          .filter(id => !staffUserIds.has(id));
      }
    }

    console.log(`[send-notification-email] Total target students: ${userIds.length}`);

    if (userIds.length === 0) {
      console.log("No target users found for notification");
      return new Response(
        JSON.stringify({ success: true, message: "No target users found", emails_sent: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user emails from profiles table (has email column)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Create a map of user_id to email from profiles
    const profileEmailMap = new Map<string, { email: string; name: string }>();
    (profiles || []).forEach(p => {
      if (p.email) {
        profileEmailMap.set(p.user_id, { email: p.email, name: p.full_name || "طالب" });
      }
    });

    // For any users not in profiles or without email, try auth.users
    const usersWithoutEmail = userIds.filter(id => !profileEmailMap.has(id));
    
    if (usersWithoutEmail.length > 0) {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authData) {
        authData.users
          .filter(user => usersWithoutEmail.includes(user.id) && user.email)
          .forEach(user => {
            profileEmailMap.set(user.id, {
              email: user.email!,
              name: user.user_metadata?.full_name || "طالب"
            });
          });
      }
    }

    const targetEmails = Array.from(profileEmailMap.values());

    console.log(`[send-notification-email] Found ${targetEmails.length} email addresses to notify`);

    if (targetEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No valid emails found", emails_sent: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send emails using Resend
    let emailsSent = 0;
    const errors: string[] = [];
    const emailHtml = generateEmailHtml(title, title_ar, message, message_ar);

    for (const { email, name } of targetEmails) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [email],
            subject: title_ar,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          emailsSent++;
          console.log(`[send-notification-email] Email sent successfully to ${email}`);
        } else {
          const errorData = await response.json();
          console.error(`[send-notification-email] Failed to send email to ${email}:`, errorData);
          errors.push(`${email}: ${errorData.message || 'Unknown error'}`);
        }
      } catch (emailError: unknown) {
        const errMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`[send-notification-email] Error sending email to ${email}:`, emailError);
        errors.push(`${email}: ${errMsg}`);
      }
    }

    console.log(`[send-notification-email] Complete: ${emailsSent}/${targetEmails.length} emails sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails_sent: emailsSent,
        total_targets: targetEmails.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("[send-notification-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});