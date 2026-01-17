import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ══════════════════════════════════════════════════════════════════════════
// CHEMISTRY TERMINOLOGY DICTIONARY
// ══════════════════════════════════════════════════════════════════════════
const CHEMISTRY_TERMS = {
  arToEn: {
    // Basic Chemistry Terms
    'ذرة': 'atom',
    'ذرات': 'atoms',
    'جزيء': 'molecule',
    'جزيئات': 'molecules',
    'عنصر': 'element',
    'عناصر': 'elements',
    'مركب': 'compound',
    'مركبات': 'compounds',
    'خليط': 'mixture',
    'مخاليط': 'mixtures',
    'محلول': 'solution',
    'محاليل': 'solutions',
    'تفاعل': 'reaction',
    'تفاعلات': 'reactions',
    'معادلة': 'equation',
    'معادلات': 'equations',
    
    // Atomic Structure
    'إلكترون': 'electron',
    'إلكترونات': 'electrons',
    'بروتون': 'proton',
    'بروتونات': 'protons',
    'نيوترون': 'neutron',
    'نيوترونات': 'neutrons',
    'نواة': 'nucleus',
    'أنوية': 'nuclei',
    'العدد الذري': 'atomic number',
    'العدد الكتلي': 'mass number',
    'النظائر': 'isotopes',
    'نظير': 'isotope',
    'مستوى الطاقة': 'energy level',
    'مستويات الطاقة': 'energy levels',
    'الغلاف الإلكتروني': 'electron shell',
    'التوزيع الإلكتروني': 'electron configuration',
    'أوربيتال': 'orbital',
    'أوربيتالات': 'orbitals',
    
    // Chemical Bonding
    'رابطة': 'bond',
    'روابط': 'bonds',
    'رابطة تساهمية': 'covalent bond',
    'رابطة أيونية': 'ionic bond',
    'رابطة فلزية': 'metallic bond',
    'رابطة هيدروجينية': 'hydrogen bond',
    'قوى فاندرفالز': 'Van der Waals forces',
    'زوج حر': 'lone pair',
    'أزواج حرة': 'lone pairs',
    'زوج رابط': 'bonding pair',
    
    // States of Matter
    'صلب': 'solid',
    'سائل': 'liquid',
    'غاز': 'gas',
    'بلازما': 'plasma',
    'تسامي': 'sublimation',
    'انصهار': 'melting',
    'تبخر': 'evaporation',
    'غليان': 'boiling',
    'تكثف': 'condensation',
    'تجمد': 'freezing',
    
    // Acids and Bases
    'حمض': 'acid',
    'أحماض': 'acids',
    'قاعدة': 'base',
    'قواعد': 'bases',
    'قلوي': 'alkali',
    'قلويات': 'alkalis',
    'متعادل': 'neutral',
    'الرقم الهيدروجيني': 'pH',
    'معايرة': 'titration',
    'تأين': 'ionization',
    'أيون': 'ion',
    'أيونات': 'ions',
    'كاتيون': 'cation',
    'أنيون': 'anion',
    
    // Organic Chemistry
    'كيمياء عضوية': 'organic chemistry',
    'هيدروكربون': 'hydrocarbon',
    'هيدروكربونات': 'hydrocarbons',
    'ألكان': 'alkane',
    'ألكين': 'alkene',
    'ألكاين': 'alkyne',
    'مجموعة وظيفية': 'functional group',
    'مجموعات وظيفية': 'functional groups',
    'كحول': 'alcohol',
    'ألدهيد': 'aldehyde',
    'كيتون': 'ketone',
    'حمض كربوكسيلي': 'carboxylic acid',
    'إستر': 'ester',
    'أمين': 'amine',
    'أميد': 'amide',
    'بوليمر': 'polymer',
    'بوليمرات': 'polymers',
    'مونومر': 'monomer',
    
    // Reactions
    'أكسدة': 'oxidation',
    'اختزال': 'reduction',
    'تأكسد واختزال': 'redox',
    'احتراق': 'combustion',
    'تحلل': 'decomposition',
    'إحلال': 'displacement',
    'إحلال مزدوج': 'double displacement',
    'ترسيب': 'precipitation',
    'راسب': 'precipitate',
    'تعادل': 'neutralization',
    'بلمرة': 'polymerization',
    'تكسير': 'cracking',
    'هدرجة': 'hydrogenation',
    
    // Thermochemistry
    'طاقة': 'energy',
    'حرارة': 'heat',
    'طارد للحرارة': 'exothermic',
    'ماص للحرارة': 'endothermic',
    'إنثالبي': 'enthalpy',
    'إنتروبي': 'entropy',
    'طاقة التنشيط': 'activation energy',
    'عامل حفاز': 'catalyst',
    'عوامل حفازة': 'catalysts',
    
    // Electrochemistry
    'كهروكيميائي': 'electrochemical',
    'خلية جلفانية': 'galvanic cell',
    'خلية إلكتروليتية': 'electrolytic cell',
    'قطب': 'electrode',
    'أنود': 'anode',
    'كاثود': 'cathode',
    'إلكتروليت': 'electrolyte',
    'تحليل كهربائي': 'electrolysis',
    
    // Periodic Table
    'الجدول الدوري': 'periodic table',
    'دورة': 'period',
    'مجموعة': 'group',
    'فلز': 'metal',
    'فلزات': 'metals',
    'لافلز': 'non-metal',
    'لافلزات': 'non-metals',
    'شبه فلز': 'metalloid',
    'غاز نبيل': 'noble gas',
    'غازات نبيلة': 'noble gases',
    'هالوجين': 'halogen',
    'هالوجينات': 'halogens',
    'فلز قلوي': 'alkali metal',
    'فلز قلوي أرضي': 'alkaline earth metal',
    
    // Quantitative Chemistry
    'مول': 'mole',
    'مولات': 'moles',
    'كتلة مولية': 'molar mass',
    'تركيز': 'concentration',
    'مولارية': 'molarity',
    'عدد أفوجادرو': 'Avogadro\'s number',
    'حجم مولي': 'molar volume',
    'نسبة مئوية': 'percentage',
    'ناتج': 'product',
    'نواتج': 'products',
    'متفاعل': 'reactant',
    'متفاعلات': 'reactants',
    
    // Common Elements (Arabic names)
    'هيدروجين': 'hydrogen',
    'أكسجين': 'oxygen',
    'نيتروجين': 'nitrogen',
    'كربون': 'carbon',
    'كبريت': 'sulfur',
    'فوسفور': 'phosphorus',
    'كلور': 'chlorine',
    'بروم': 'bromine',
    'يود': 'iodine',
    'فلور': 'fluorine',
    'صوديوم': 'sodium',
    'بوتاسيوم': 'potassium',
    'كالسيوم': 'calcium',
    'ماغنسيوم': 'magnesium',
    'حديد': 'iron',
    'نحاس': 'copper',
    'زنك': 'zinc',
    'ذهب': 'gold',
    'فضة': 'silver',
    'ألومنيوم': 'aluminum',
  },
  enToAr: {} as Record<string, string>
};

// Build reverse mapping (English to Arabic)
for (const [ar, en] of Object.entries(CHEMISTRY_TERMS.arToEn)) {
  CHEMISTRY_TERMS.enToAr[en] = ar;
  CHEMISTRY_TERMS.enToAr[en.toLowerCase()] = ar;
  // Also add capitalized version
  CHEMISTRY_TERMS.enToAr[en.charAt(0).toUpperCase() + en.slice(1)] = ar;
}

// ══════════════════════════════════════════════════════════════════════════
// GRADE & EDUCATIONAL TERMINOLOGY
// ══════════════════════════════════════════════════════════════════════════
const EDUCATIONAL_TERMS = {
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
    'سؤال': 'Question',
    'أسئلة': 'Questions',
    'إجابة': 'Answer',
    'إجابات': 'Answers',
    'صح': 'True',
    'خطأ': 'False',
    'اختر': 'Choose',
    'اختر الإجابة الصحيحة': 'Choose the correct answer',
    'أكمل': 'Complete',
    'علل': 'Explain why',
    'قارن بين': 'Compare between',
    'ما المقصود': 'What is meant by',
    'اذكر': 'Mention',
    'وضح': 'Explain',
    'احسب': 'Calculate',
    'فسر': 'Interpret',
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
    'Question': 'سؤال',
    'Questions': 'أسئلة',
    'Answer': 'إجابة',
    'Answers': 'إجابات',
    'True': 'صح',
    'False': 'خطأ',
    'Choose': 'اختر',
    'Choose the correct answer': 'اختر الإجابة الصحيحة',
    'Complete': 'أكمل',
    'Explain why': 'علل',
    'Compare between': 'قارن بين',
    'What is meant by': 'ما المقصود',
    'Mention': 'اذكر',
    'Explain': 'وضح',
    'Calculate': 'احسب',
    'Interpret': 'فسر',
  }
};

// Preserve chemical formulas - don't translate these
const CHEMICAL_FORMULA_PATTERN = /([A-Z][a-z]?\d*)+(\([A-Z][a-z]?\d*\)\d*)*/g;
const PRESERVE_PATTERNS = [
  /H₂O/g, /CO₂/g, /O₂/g, /N₂/g, /H₂/g, /Cl₂/g,
  /NaCl/g, /HCl/g, /H₂SO₄/g, /HNO₃/g, /NaOH/g, /KOH/g,
  /CaCO₃/g, /Na₂CO₃/g, /NaHCO₃/g,
  /CH₄/g, /C₂H₆/g, /C₂H₄/g, /C₂H₂/g,
  /Fe₂O₃/g, /Al₂O₃/g, /CuSO₄/g, /FeSO₄/g,
];

// Apply terminology fixes to ensure consistency
function applyTerminologyFixes(text: string, targetLanguage: 'en' | 'ar'): string {
  let result = text;
  
  // Get the appropriate dictionaries
  const chemTerms = targetLanguage === 'en' ? CHEMISTRY_TERMS.arToEn : CHEMISTRY_TERMS.enToAr;
  const eduTerms = targetLanguage === 'en' ? EDUCATIONAL_TERMS.arToEn : EDUCATIONAL_TERMS.enToAr;
  
  // Apply educational terms first (more specific phrases)
  for (const [source, target] of Object.entries(eduTerms)) {
    const regex = new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, target);
  }
  
  // Apply chemistry terms
  for (const [source, target] of Object.entries(chemTerms)) {
    // Use word boundaries for better matching
    const regex = new RegExp(`\\b${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, target);
  }
  
  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// FALLBACK LOCAL TRANSLATION (Dictionary-based)
// ══════════════════════════════════════════════════════════════════════════
function localDictionaryTranslation(text: string, targetLanguage: 'en' | 'ar'): string {
  let result = text;
  
  // Get the appropriate dictionaries - sorted by length (longer phrases first)
  const chemTerms = targetLanguage === 'en' ? CHEMISTRY_TERMS.arToEn : CHEMISTRY_TERMS.enToAr;
  const eduTerms = targetLanguage === 'en' ? EDUCATIONAL_TERMS.arToEn : EDUCATIONAL_TERMS.enToAr;
  
  // Combine and sort by source length (descending) to replace longer phrases first
  const allTerms: [string, string][] = [
    ...Object.entries(eduTerms),
    ...Object.entries(chemTerms),
  ].sort((a, b) => b[0].length - a[0].length);
  
  // Apply all term replacements
  for (const [source, target] of allTerms) {
    // Escape special regex characters
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    result = result.replace(regex, target);
  }
  
  // For Arabic to English: Add basic word order adjustment for common patterns
  if (targetLanguage === 'en') {
    // Common Arabic patterns that need adjustment
    result = result
      .replace(/كورس\s+ال(\w+)\s+ال(\w+)/g, '$1 $2 Course') // "Course Chemistry Complete" style
      .replace(/العام الدراسي/g, 'Academic Year')
      .replace(/الفصل الدراسي/g, 'Semester');
  }
  
  console.log(`[FALLBACK] Dictionary translation: "${text.substring(0, 40)}..." -> "${result.substring(0, 40)}..."`);
  
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

    // Build terminology guidance for the AI - include chemistry terms
    const chemistryGuide = targetLanguage === 'en'
      ? `CHEMISTRY TERMS: Keep chemical formulas like H₂O, CO₂, NaCl unchanged.
         Use standard chemistry translations: ذرة→atom, جزيء→molecule, عنصر→element, مركب→compound,
         إلكترون→electron, بروتون→proton, نيوترون→neutron, رابطة تساهمية→covalent bond,
         رابطة أيونية→ionic bond, أكسدة→oxidation, اختزال→reduction, حمض→acid, قاعدة→base`
      : `CHEMISTRY TERMS: Keep chemical formulas like H₂O, CO₂, NaCl unchanged.
         Use standard chemistry translations: atom→ذرة, molecule→جزيء, element→عنصر, compound→مركب,
         electron→إلكترون, proton→بروتون, neutron→نيوترون, covalent bond→رابطة تساهمية,
         ionic bond→رابطة أيونية, oxidation→أكسدة, reduction→اختزال, acid→حمض, base→قاعدة`;

    const terminologyGuide = targetLanguage === 'en'
      ? `EDUCATIONAL TERMS:
         - تانية ثانوي / ثانية ثانوي → 2nd Secondary (NOT "Second Secondary")
         - تالته ثانوي / ثالثة ثانوي → 3rd Secondary (NOT "Third Secondary")
         - عربي → Arabic, لغات → Languages
         - حصة/حصص → Session/Sessions, باب/أبواب → Chapter/Chapters
         QUESTION TERMS: اختر→Choose, علل→Explain why, احسب→Calculate, قارن بين→Compare between`
      : `EDUCATIONAL TERMS:
         - 2nd Secondary → تانية ثانوي, 3rd Secondary → تالته ثانوي
         - Arabic → عربي, Languages → لغات
         - Session/Sessions → حصة/حصص, Chapter/Chapters → باب/أبواب
         QUESTION TERMS: Choose→اختر, Explain why→علل, Calculate→احسب, Compare between→قارن بين`;

    const systemPrompt = targetLanguage === 'en' 
      ? `You are a professional translator for an Egyptian educational platform (Thanaweya Amma - Chemistry).
         Translate the following Arabic text to English.
         Keep the translation natural and contextually appropriate.
         PRESERVE all chemical formulas and equations exactly as written.
         ${chemistryGuide}
         ${terminologyGuide}
         Only return the translated text, nothing else. No explanations or notes.`
      : `You are a professional translator for an Egyptian educational platform (Thanaweya Amma - Chemistry).
         Translate the following English text to Arabic.
         Use Egyptian colloquial Arabic (عامية مصرية محترمة) for educational terms.
         PRESERVE all chemical formulas and equations exactly as written.
         ${chemistryGuide}
         ${terminologyGuide}
         Only return the translated text, nothing else. No explanations or notes.`;

    // Retry logic with exponential backoff for transient errors
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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

        if (response.ok) {
          const data = await response.json();
          let translatedText = data.choices?.[0]?.message?.content?.trim() || '';
          
          // Apply terminology fixes to ensure consistency
          translatedText = applyTerminologyFixes(translatedText, targetLanguage);

          console.log(`Translated: "${text.substring(0, 50)}..." -> "${translatedText.substring(0, 50)}..."`);

          return new Response(JSON.stringify({ translatedText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Handle specific error codes
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
        
        // For 502/503/504 errors, retry with backoff
        if (response.status >= 500 && attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
          console.log(`AI gateway error ${response.status}, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        lastError = new Error(`AI gateway error: ${response.status}`);
      } catch (fetchError) {
        console.error(`Fetch error on attempt ${attempt}:`, fetchError);
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }
    
    // All retries exhausted - use fallback dictionary translation
    console.log('AI gateway unavailable, using local dictionary fallback');
    const fallbackTranslation = localDictionaryTranslation(text, targetLanguage as 'en' | 'ar');
    
    return new Response(JSON.stringify({ 
      translatedText: fallbackTranslation,
      fallback: true // Flag to indicate fallback was used
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Translation error:', error);
    
    // Even on unexpected errors, try dictionary fallback
    try {
      const { text, targetLanguage = 'en' } = await req.clone().json();
      if (text) {
        const fallbackTranslation = localDictionaryTranslation(text, targetLanguage as 'en' | 'ar');
        return new Response(JSON.stringify({ 
          translatedText: fallbackTranslation,
          fallback: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // Fallback parsing failed, return original error
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
