import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  notification_id: string;
  target_type: "all" | "course" | "lesson" | "user" | "grade" | "attendance_mode";
  target_value?: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: string;
}

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

    const { 
      notification_id,
      target_type, 
      target_value, 
      title, 
      title_ar, 
      message, 
      message_ar,
      type 
    }: NotificationEmailRequest = await req.json();

    console.log(`Processing email notification: ${notification_id}, target: ${target_type}`);

    // Get target users based on targeting
    let userIds: string[] = [];

    if (target_type === "all") {
      // Get all student users
      const { data: studentRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");
      
      userIds = (studentRoles || []).map(r => r.user_id);
    } else if (target_type === "user" && target_value) {
      userIds = [target_value];
    } else if (target_type === "course" && target_value) {
      // Get users enrolled in the course
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("user_id")
        .eq("course_id", target_value);
      
      userIds = (enrollments || []).map(e => e.user_id);
    } else if (target_type === "grade" && target_value) {
      // Get users in specific grade
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("grade", target_value);
      
      userIds = (profiles || []).map(p => p.user_id);
    } else if (target_type === "attendance_mode" && target_value) {
      // Get users with specific attendance mode
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("attendance_mode", target_value);
      
      userIds = (profiles || []).map(p => p.user_id);
    }

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

    // Get user emails from auth.users (using service role)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching users:", authError);
      throw authError;
    }

    const targetEmails = authData.users
      .filter(user => userIds.includes(user.id) && user.email)
      .map(user => ({
        email: user.email!,
        name: user.user_metadata?.full_name || "Student"
      }));

    console.log(`Found ${targetEmails.length} email addresses to notify`);

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

    for (const { email, name } of targetEmails) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Hossam Fekry Platform <notifications@resend.dev>",
            to: [email],
            subject: `${title} | ${title_ar}`,
            html: `
              <!DOCTYPE html>
              <html dir="rtl">
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                  .container { max-width: 600px; margin: 0 auto; background: white; }
                  .header { background: #3173B8; color: white; padding: 20px; text-align: center; }
                  .content { padding: 30px; }
                  .message-ar { direction: rtl; text-align: right; margin-bottom: 20px; padding: 20px; background: #f8fafc; border-radius: 8px; }
                  .message-en { direction: ltr; text-align: left; padding: 20px; background: #f1f5f9; border-radius: 8px; }
                  .footer { background: #e2e8f0; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
                  h1 { margin: 0; font-size: 24px; }
                  h2 { color: #3173B8; margin-top: 0; }
                  p { line-height: 1.6; color: #334155; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>منصة حسام فكري التعليمية</h1>
                  </div>
                  <div class="content">
                    <div class="message-ar">
                      <h2>${title_ar}</h2>
                      <p>${message_ar}</p>
                    </div>
                    <div class="message-en">
                      <h2>${title}</h2>
                      <p>${message}</p>
                    </div>
                  </div>
                  <div class="footer">
                    <p>Hossam Fekry Educational Platform</p>
                    <p>This is an automated notification. Please do not reply to this email.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (response.ok) {
          emailsSent++;
          console.log(`Email sent successfully to ${email}`);
        } else {
          const errorData = await response.json();
          console.error(`Failed to send email to ${email}:`, errorData);
          errors.push(`${email}: ${errorData.message || 'Unknown error'}`);
        }
      } catch (emailError: unknown) {
        const errMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`Error sending email to ${email}:`, emailError);
        errors.push(`${email}: ${errMsg}`);
      }
    }

    console.log(`Email notification complete: ${emailsSent}/${targetEmails.length} emails sent`);

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
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
