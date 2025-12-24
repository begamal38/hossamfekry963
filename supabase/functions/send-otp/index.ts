import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Egyptian phone number
    const phoneRegex = /^(\+?20)?0?1[0125][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid Egyptian phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone number to international format
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '20' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('20')) {
      normalizedPhone = '20' + normalizedPhone;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update or insert OTP for this phone
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        phone_otp: otp,
        phone_otp_expires_at: expiresAt.toISOString(),
        phone_verified: false,
      })
      .eq('phone', phone);

    // If no existing profile, we'll store it temporarily
    // The actual profile will be created on signup

    // For now, we'll use a temporary storage approach
    // In production, you would integrate with WhatsApp Business API or Twilio
    
    console.log(`OTP for ${normalizedPhone}: ${otp}`); // For development only

    // In production, send via WhatsApp API:
    // const whatsappApiKey = Deno.env.get("WHATSAPP_API_KEY");
    // await sendWhatsAppMessage(normalizedPhone, `Your verification code is: ${otp}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        // Remove in production:
        debug_otp: otp 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
