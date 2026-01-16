/**
 * Arabic Name Localization Utility
 * Converts Arabic names to readable English phonetic equivalents
 * Uses common English forms for familiar names + smart phonetic mapping for others
 * 
 * DISPLAY-ONLY: Does not modify stored data
 */

// Common Arabic first names with their proper English equivalents
const commonNameMappings: Record<string, string> = {
  // Male names
  'محمد': 'Mohamed',
  'أحمد': 'Ahmed',
  'احمد': 'Ahmed',
  'علي': 'Ali',
  'عمر': 'Omar',
  'يوسف': 'Youssef',
  'إبراهيم': 'Ibrahim',
  'ابراهيم': 'Ibrahim',
  'إسلام': 'Islam',
  'اسلام': 'Islam',
  'حسن': 'Hassan',
  'حسين': 'Hussein',
  'خالد': 'Khaled',
  'كريم': 'Karim',
  'مصطفى': 'Mostafa',
  'محمود': 'Mahmoud',
  'أيمن': 'Ayman',
  'ايمن': 'Ayman',
  'سيد': 'Sayed',
  'عبدالله': 'Abdullah',
  'عبد الله': 'Abdullah',
  'عبدالرحمن': 'Abdulrahman',
  'عبد الرحمن': 'Abdulrahman',
  'طارق': 'Tarek',
  'هشام': 'Hesham',
  'وليد': 'Walid',
  'ياسر': 'Yasser',
  'ياسين': 'Yassin',
  'زياد': 'Ziad',
  'رامي': 'Ramy',
  'سامي': 'Samy',
  'عمرو': 'Amr',
  'مروان': 'Marwan',
  'فادي': 'Fady',
  'باسم': 'Bassem',
  'عاطف': 'Atef',
  'راضي': 'Rady',
  'نادي': 'Nady',
  'جابر': 'Gaber',
  'بدوي': 'Badawy',
  'نصر': 'Nasr',
  'حماده': 'Hamada',
  'حمادة': 'Hamada',
  'مجدي': 'Magdy',
  
  // Female names
  'فاطمة': 'Fatma',
  'مريم': 'Mariam',
  'نور': 'Nour',
  'سارة': 'Sara',
  'ساره': 'Sara',
  'ٍساره': 'Sara',
  'ٍسارة': 'Sara',
  'هبة': 'Heba',
  'منة': 'Menna',
  'منه': 'Menna',
  'آية': 'Aya',
  'ايه': 'Aya',
  'دينا': 'Dina',
  'رنا': 'Rana',
  'ريم': 'Reem',
  'سلمى': 'Salma',
  'ياسمين': 'Yasmin',
  'حبيبة': 'Habiba',
  'حبيبه': 'Habiba',
  'إيثار': 'Eethar',
  'ايثار': 'Eethar',
  'الله': 'Allah',
  
  // Common compound parts
  'عبد': 'Abd',
  'أبو': 'Abu',
  'ابو': 'Abu',
  'أم': 'Om',
  'ام': 'Om',
  'بن': 'Ben',
  'بنت': 'Bent',
};

// Arabic letter to phonetic English mapping (for names not in common list)
const arabicToPhonetic: Record<string, string> = {
  'ا': 'a',
  'أ': 'a',
  'إ': 'e',
  'آ': 'a',
  'ب': 'b',
  'ت': 't',
  'ث': 'th',
  'ج': 'g',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'z',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'd',
  'ط': 't',
  'ظ': 'z',
  'ع': 'a',
  'غ': 'gh',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'ة': 'a',
  'و': 'w',
  'ي': 'y',
  'ى': 'a',
  'ء': '',
  'ئ': 'e',
  'ؤ': 'o',
  // Diacritics (tashkeel)
  'َ': 'a',
  'ُ': 'o',
  'ِ': 'e',
  'ّ': '',
  'ْ': '',
  'ً': '',
  'ٌ': '',
  'ٍ': '',
};

// Vowel insertion rules for readable output
const needsVowelAfter = new Set(['b', 't', 'th', 'g', 'h', 'kh', 'd', 'z', 'r', 's', 'sh', 'f', 'q', 'k', 'l', 'm', 'n', 'gh']);

/**
 * Convert a single Arabic word to readable English phonetic
 */
function phoneticConvert(arabicWord: string): string {
  // First check if it's a known common name
  const normalized = arabicWord.trim();
  if (commonNameMappings[normalized]) {
    return commonNameMappings[normalized];
  }
  
  // Fallback to phonetic conversion with vowel insertion
  let result = '';
  let prevWasConsonant = false;
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const phonetic = arabicToPhonetic[char];
    
    if (phonetic !== undefined) {
      // Check if we need to insert a vowel between consonants
      if (prevWasConsonant && needsVowelAfter.has(phonetic) && phonetic.length > 0) {
        // Insert 'a' or 'o' between consonants for readability
        result += 'a';
      }
      
      result += phonetic;
      prevWasConsonant = needsVowelAfter.has(phonetic);
    } else if (char === ' ') {
      result += ' ';
      prevWasConsonant = false;
    }
  }
  
  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Localize a full Arabic name to readable English
 * Handles multi-word names (first name, father's name, family name)
 */
export function localizeArabicName(arabicName: string): string {
  if (!arabicName || typeof arabicName !== 'string') {
    return '';
  }
  
  // Split by spaces and process each word
  const words = arabicName.trim().split(/\s+/);
  const localizedWords = words.map(word => phoneticConvert(word));
  
  return localizedWords.join(' ');
}

/**
 * Get the display name based on UI language
 * @param arabicName - Original Arabic name (always available)
 * @param englishName - Stored English name (may be empty or transliterated)
 * @param isArabicUI - Whether the UI is in Arabic mode
 */
export function getLocalizedDisplayName(
  arabicName: string,
  englishName: string | null | undefined,
  isArabicUI: boolean
): string {
  // Arabic UI: Always show Arabic name
  if (isArabicUI) {
    return arabicName;
  }
  
  // English UI: Check if stored English name is valid (not empty, not just consonants)
  if (englishName && englishName.trim()) {
    // Check if it looks like a proper English name (has vowels)
    const hasVowels = /[aeiouAEIOU]/.test(englishName);
    const isProperlyFormatted = hasVowels && englishName.length > 2;
    
    if (isProperlyFormatted) {
      return englishName;
    }
  }
  
  // Fallback: Smart localization from Arabic
  return localizeArabicName(arabicName);
}
