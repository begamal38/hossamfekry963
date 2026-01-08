import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standardized grade terminology reference
const TERMINOLOGY_REFERENCE = {
  arToEn: {
    'تانية ثانوي': '2nd Secondary',
    'ثانية ثانوي': '2nd Secondary',
    'الصف الثاني الثانوي': '2nd Secondary',
    'تالته ثانوي': '3rd Secondary',
    'ثالثة ثانوي': '3rd Secondary',
    'الصف الثالث الثانوي': '3rd Secondary',
    'عربي': 'Arabic',
    'لغات': 'Languages',
    'مسار عربي': 'Arabic Track',
    'مسار لغات': 'Languages Track',
    'حصة': 'Session',
    'حصص': 'Sessions',
    'باب': 'Chapter',
    'أبواب': 'Chapters',
    'امتحان': 'Exam',
    'امتحانات': 'Exams',
    'كورس': 'Course',
    'كورسات': 'Courses',
    'المنصة': 'Platform',
  },
  enToAr: {
    '2nd Secondary': 'تانية ثانوي',
    '2nd secondary': 'تانية ثانوي',
    'Second Secondary': 'تانية ثانوي',
    'second secondary': 'تانية ثانوي',
    '3rd Secondary': 'تالته ثانوي',
    '3rd secondary': 'تالته ثانوي',
    'Third Secondary': 'تالته ثانوي',
    'third secondary': 'تالته ثانوي',
    'Arabic': 'عربي',
    'arabic': 'عربي',
    'Languages': 'لغات',
    'languages': 'لغات',
    'Arabic Track': 'مسار عربي',
    'Languages Track': 'مسار لغات',
    'Session': 'حصة',
    'Sessions': 'حصص',
    'Chapter': 'باب',
    'Chapters': 'أبواب',
    'Exam': 'امتحان',
    'Exams': 'امتحانات',
    'Course': 'كورس',
    'Courses': 'كورسات',
    'Platform': 'المنصة',
    'Dashboard': 'المنصة',
  }
};

// Apply terminology fixes to ensure consistency
function applyTerminologyFixes(text: string, targetLanguage: 'en' | 'ar'): string {
  let result = text;
  const reference = targetLanguage === 'en' ? TERMINOLOGY_REFERENCE.arToEn : TERMINOLOGY_REFERENCE.enToAr;
  
  // Apply each replacement
  for (const [source, target] of Object.entries(reference)) {
    const regex = new RegExp(source, 'gi');
    result = result.replace(regex, target);
  }
  
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage = 'en' } = await req.json();
    
    if (!text || text.trim() === '') {
      return new Response(JSON.stringify({ translatedText: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build terminology guidance for the AI
    const terminologyGuide = targetLanguage === 'en'
      ? `IMPORTANT: Use these exact translations for educational terms:
         - تانية ثانوي / ثانية ثانوي → 2nd Secondary (NOT "Second Secondary")
         - تالته ثانوي / ثالثة ثانوي → 3rd Secondary (NOT "Third Secondary")
         - عربي → Arabic
         - لغات → Languages
         - حصة/حصص → Session/Sessions
         - باب/أبواب → Chapter/Chapters`
      : `IMPORTANT: Use these exact translations for educational terms:
         - 2nd Secondary / Second Secondary → تانية ثانوي
         - 3rd Secondary / Third Secondary → تالته ثانوي
         - Arabic → عربي
         - Languages → لغات
         - Session/Sessions → حصة/حصص
         - Chapter/Chapters → باب/أبواب`;

    const systemPrompt = targetLanguage === 'en' 
      ? `You are a professional translator for an Egyptian educational platform (Thanaweya Amma - Chemistry).
         Translate the following Arabic text to English.
         Keep the translation natural and contextually appropriate.
         ${terminologyGuide}
         Only return the translated text, nothing else. No explanations or notes.`
      : `You are a professional translator for an Egyptian educational platform (Thanaweya Amma - Chemistry).
         Translate the following English text to Arabic.
         Use Egyptian colloquial Arabic (عامية مصرية محترمة) for educational terms.
         ${terminologyGuide}
         Only return the translated text, nothing else. No explanations or notes.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let translatedText = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Apply terminology fixes to ensure consistency
    translatedText = applyTerminologyFixes(translatedText, targetLanguage);

    console.log(`Translated: "${text.substring(0, 50)}..." -> "${translatedText.substring(0, 50)}..."`);

    return new Response(JSON.stringify({ translatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Translation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
