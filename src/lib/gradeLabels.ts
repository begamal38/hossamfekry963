/**
 * Unified Grade & Track Labels
 * 
 * This is the SINGLE SOURCE OF TRUTH for all grade and track labels.
 * All files should import from here instead of defining their own labels.
 * 
 * Standard Terminology:
 * - English: "2nd Secondary", "3rd Secondary", "Arabic", "Languages"
 * - Arabic: "تانية ثانوي", "تالته ثانوي", "عربي", "لغات"
 */

// ══════════════════════════════════════════════════════════════════════════
// GRADE LABELS (Academic Year)
// ══════════════════════════════════════════════════════════════════════════
export const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
  'second_secondary': { ar: 'تانية ثانوي', en: '2nd Secondary' },
  'third_secondary': { ar: 'تالته ثانوي', en: '3rd Secondary' },
};

// ══════════════════════════════════════════════════════════════════════════
// TRACK LABELS (Language Track)
// ══════════════════════════════════════════════════════════════════════════
export const TRACK_LABELS: Record<string, { ar: string; en: string }> = {
  'arabic': { ar: 'عربي', en: 'Arabic' },
  'languages': { ar: 'لغات', en: 'Languages' },
};

// ══════════════════════════════════════════════════════════════════════════
// COMBINED GRADE + TRACK LABELS
// ══════════════════════════════════════════════════════════════════════════
export const COMBINED_GRADE_LABELS: Record<string, { ar: string; en: string }> = {
  'second_arabic': { ar: 'تانية ثانوي - عربي', en: '2nd Secondary - Arabic' },
  'second_languages': { ar: 'تانية ثانوي - لغات', en: '2nd Secondary - Languages' },
  'third_arabic': { ar: 'تالته ثانوي - عربي', en: '3rd Secondary - Arabic' },
  'third_languages': { ar: 'تالته ثانوي - لغات', en: '3rd Secondary - Languages' },
};

// ══════════════════════════════════════════════════════════════════════════
// GRADE OPTIONS (for dropdowns and forms)
// ══════════════════════════════════════════════════════════════════════════
export const ACADEMIC_YEAR_OPTIONS = [
  { value: 'second_secondary', labelAr: 'تانية ثانوي', labelEn: '2nd Secondary' },
  { value: 'third_secondary', labelAr: 'تالته ثانوي', labelEn: '3rd Secondary' },
];

export const LANGUAGE_TRACK_OPTIONS = [
  { value: 'arabic', labelAr: 'عربي', labelEn: 'Arabic' },
  { value: 'languages', labelAr: 'لغات', labelEn: 'Languages' },
];

export const COMBINED_GRADE_OPTIONS = [
  { value: 'second_arabic', labelAr: 'تانية ثانوي - عربي', labelEn: '2nd Secondary - Arabic' },
  { value: 'second_languages', labelAr: 'تانية ثانوي - لغات', labelEn: '2nd Secondary - Languages' },
  { value: 'third_arabic', labelAr: 'تالته ثانوي - عربي', labelEn: '3rd Secondary - Arabic' },
  { value: 'third_languages', labelAr: 'تالته ثانوي - لغات', labelEn: '3rd Secondary - Languages' },
];

// ══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Get the label for a combined grade (legacy) or normalized grade
 * Supports both old format (second_arabic) and new format (second_secondary)
 */
export function getCombinedGradeLabel(grade: string | null, isArabic: boolean, languageTrack?: string | null): string {
  if (!grade) return isArabic ? 'غير محدد' : 'Not specified';
  
  // Try new normalized format first (grade + separate track)
  if (GRADE_LABELS[grade] && languageTrack && TRACK_LABELS[languageTrack]) {
    const gradeLabel = GRADE_LABELS[grade];
    const trackLabel = TRACK_LABELS[languageTrack];
    return isArabic ? `${gradeLabel.ar} - ${trackLabel.ar}` : `${gradeLabel.en} - ${trackLabel.en}`;
  }
  
  // Try new format without track
  if (GRADE_LABELS[grade]) {
    return isArabic ? GRADE_LABELS[grade].ar : GRADE_LABELS[grade].en;
  }
  
  // Fallback to legacy combined format
  const label = COMBINED_GRADE_LABELS[grade];
  return label ? (isArabic ? label.ar : label.en) : grade;
}

/**
 * Get the label for an academic year (e.g., "second_secondary")
 */
export function getAcademicYearLabel(academicYear: string | null, isArabic: boolean): string {
  if (!academicYear) return isArabic ? 'غير محدد' : 'Not specified';
  const label = GRADE_LABELS[academicYear];
  return label ? (isArabic ? label.ar : label.en) : academicYear;
}

/**
 * Get the label for a language track (e.g., "arabic" or "languages")
 */
export function getLanguageTrackLabel(track: string | null, isArabic: boolean): string {
  if (!track) return isArabic ? 'غير محدد' : 'Not specified';
  const label = TRACK_LABELS[track];
  return label ? (isArabic ? label.ar : label.en) : track;
}

/**
 * Get the full group label combining academic year and language track
 */
export function getFullGroupLabel(
  academicYear: string | null,
  languageTrack: string | null,
  isArabic: boolean
): string | null {
  if (!academicYear || !languageTrack) return null;
  const year = GRADE_LABELS[academicYear];
  const track = TRACK_LABELS[languageTrack];
  if (!year || !track) return null;
  return isArabic ? `${year.ar} - ${track.ar}` : `${year.en} - ${track.en}`;
}

/**
 * Translation reference map for AI translation consistency
 * Used by the translate-content edge function
 */
export const TRANSLATION_REFERENCE = {
  // Arabic to English
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
  
  // English to Arabic
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
};
