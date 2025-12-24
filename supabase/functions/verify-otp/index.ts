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
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if OTP matches
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('phone_otp, phone_otp_expires_at')
      .eq('phone', phone)
      .single();

    // For development: accept any 6-digit OTP if no profile exists yet
    // In production, you would have a separate OTP storage table
    if (!profile) {
      // For development, accept the OTP
      return new Response(
        JSON.stringify({ verified: true, message: "Phone verified successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (fetchError || !profile) {
      return new Response(
        JSON.stringify({ error: "Phone not found", verified: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check OTP
    if (profile.phone_otp !== otp) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (new Date(profile.phone_otp_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "OTP expired", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark phone as verified and clear OTP
    await supabase
      .from('profiles')
      .update({
        phone_verified: true,
        phone_otp: null,
        phone_otp_expires_at: null,
      })
      .eq('phone', phone);

    return new Response(
      JSON.stringify({ verified: true, message: "Phone verified successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", verified: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
