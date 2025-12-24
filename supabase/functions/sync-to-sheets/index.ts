import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRADE_LABELS: Record<string, string> = {
  'second_arabic': 'ثانية ثانوي عربي',
  'second_languages': 'ثانية ثانوي لغات',
  'third_arabic': 'ثالثة ثانوي عربي',
  'third_languages': 'ثالثة ثانوي لغات',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleSheetsApiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    const spreadsheetId = Deno.env.get("GOOGLE_SPREADSHEET_ID");

    if (!googleSheetsApiKey || !spreadsheetId) {
      return new Response(
        JSON.stringify({ error: "Google Sheets not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, studentData } = await req.json();

    // For automatic sync on signup
    if (action === "add_student" && studentData) {
      const { full_name, email, phone, grade, created_at } = studentData;
      
      const gradeLabel = grade ? GRADE_LABELS[grade] || grade : "";
      
      // Append row to Google Sheet
      const range = "Sheet1!A:F";
      const values = [[
        full_name || "",
        email || "",
        phone || "",
        gradeLabel,
        created_at || new Date().toISOString(),
        "Active"
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${googleSheetsApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to append to Google Sheets");
      }

      return new Response(
        JSON.stringify({ success: true, message: "Student added to sheet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For manual export of all students
    if (action === "export_all") {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Clear existing data and add all profiles
      const values = [
        ["Full Name", "Email", "Phone", "Grade", "Created At", "Phone Verified"],
        ...profiles.map(p => [
          p.full_name || "",
          "", // Email is in auth.users, would need to join
          p.phone || "",
          p.grade ? GRADE_LABELS[p.grade] || p.grade : "",
          p.created_at,
          p.phone_verified ? "Yes" : "No"
        ])
      ];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:F?valueInputOption=USER_ENTERED&key=${googleSheetsApiKey}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update Google Sheets");
      }

      return new Response(
        JSON.stringify({ success: true, message: "All students exported", count: profiles.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});