/**
 * Academic Path Validation Utilities
 * 
 * The platform operates on 4 strictly separated academic paths:
 * 1) 2nd Secondary – Arabic
 * 2) 2nd Secondary – Languages
 * 3) 3rd Secondary – Arabic
 * 4) 3rd Secondary – Languages
 * 
 * No user, content, or group may cross these paths.
 */

export interface AcademicPath {
  grade: string | null;
  track: string | null;
}

// Map the combined grade field to separate grade/track
export function parseAcademicPath(gradeField: string | null): AcademicPath {
  if (!gradeField) return { grade: null, track: null };
  
  // Handle new format (academic_year + language_track)
  if (gradeField === 'second_secondary' || gradeField === 'third_secondary') {
    return { grade: gradeField, track: null };
  }
  
  // Handle legacy combined format
  const mapping: Record<string, AcademicPath> = {
    'second_arabic': { grade: 'second_secondary', track: 'arabic' },
    'second_languages': { grade: 'second_secondary', track: 'languages' },
    'third_arabic': { grade: 'third_secondary', track: 'arabic' },
    'third_languages': { grade: 'third_secondary', track: 'languages' },
  };
  
  return mapping[gradeField] || { grade: null, track: null };
}

// Combine grade and track into a single identifier
export function combineAcademicPath(grade: string | null, track: string | null): string | null {
  if (!grade || !track) return null;
  
  const gradePrefix = grade === 'second_secondary' ? 'second' : 
                      grade === 'third_secondary' ? 'third' : null;
  
  if (!gradePrefix) return null;
  
  return `${gradePrefix}_${track}`;
}

// Check if two academic paths match exactly
export function academicPathsMatch(
  path1: AcademicPath | { academic_year?: string | null; language_track?: string | null; grade?: string | null },
  path2: AcademicPath | { academic_year?: string | null; language_track?: string | null; grade?: string | null }
): boolean {
  // Normalize path1
  let grade1 = (path1 as any).grade || (path1 as any).academic_year || null;
  let track1 = (path1 as any).track || (path1 as any).language_track || null;
  
  // If grade1 is combined format, parse it
  if (grade1 && !track1) {
    const parsed = parseAcademicPath(grade1);
    grade1 = parsed.grade;
    track1 = parsed.track;
  }
  
  // Normalize path2
  let grade2 = (path2 as any).grade || (path2 as any).academic_year || null;
  let track2 = (path2 as any).track || (path2 as any).language_track || null;
  
  // If grade2 is combined format, parse it
  if (grade2 && !track2) {
    const parsed = parseAcademicPath(grade2);
    grade2 = parsed.grade;
    track2 = parsed.track;
  }
  
  return grade1 === grade2 && track1 === track2;
}

// Validate if a student can access content for a specific academic path
export function canAccessContent(
  studentProfile: { academic_year?: string | null; language_track?: string | null; grade?: string | null },
  contentPath: { grade?: string | null; language_track?: string | null }
): { allowed: boolean; message: string; messageAr: string } {
  // Normalize student path
  let studentGrade = studentProfile.academic_year || null;
  let studentTrack = studentProfile.language_track || null;
  
  // Handle legacy combined grade field
  if (!studentGrade && studentProfile.grade) {
    const parsed = parseAcademicPath(studentProfile.grade);
    studentGrade = parsed.grade;
    studentTrack = parsed.track || studentTrack;
  }
  
  // Normalize content path
  const contentGrade = contentPath.grade || null;
  const contentTrack = contentPath.language_track || null;
  
  // If content has no restrictions, allow access
  if (!contentGrade && !contentTrack) {
    return { allowed: true, message: '', messageAr: '' };
  }
  
  // Check grade match
  if (contentGrade && studentGrade !== contentGrade) {
    const gradeLabel = contentGrade === 'second_secondary' 
      ? { ar: 'الصف الثاني الثانوي', en: 'Second Secondary' }
      : { ar: 'الصف الثالث الثانوي', en: 'Third Secondary' };
    
    return {
      allowed: false,
      message: `This content is for ${gradeLabel.en} students only`,
      messageAr: `هذا المحتوى مخصص لطلاب ${gradeLabel.ar} فقط`,
    };
  }
  
  // Check track match
  if (contentTrack && studentTrack !== contentTrack) {
    const trackLabel = contentTrack === 'arabic'
      ? { ar: 'المسار العربي', en: 'Arabic track' }
      : { ar: 'مسار اللغات', en: 'Languages track' };
    
    const fullLabel = contentGrade
      ? `${contentGrade === 'second_secondary' ? 'الصف الثاني الثانوي' : 'الصف الثالث الثانوي'} ${trackLabel.ar}`
      : trackLabel.ar;
    
    return {
      allowed: false,
      message: `This content is for ${trackLabel.en} students only`,
      messageAr: `هذا المحتوى مخصص لطلاب ${fullLabel} فقط`,
    };
  }
  
  return { allowed: true, message: '', messageAr: '' };
}

// Validate if a student can be added to a center group
export function canJoinCenterGroup(
  studentProfile: { academic_year?: string | null; language_track?: string | null; attendance_mode?: string | null },
  groupPath: { grade: string; language_track: string }
): { allowed: boolean; message: string; messageAr: string } {
  // Check attendance mode first
  if (studentProfile.attendance_mode !== 'center' && studentProfile.attendance_mode !== 'hybrid') {
    return {
      allowed: false,
      message: 'Only center or hybrid attendance students can join center groups',
      messageAr: 'فقط طلاب السنتر أو الحضور الهجين يمكنهم الانضمام لمجموعات السنتر',
    };
  }
  
  // Check academic path match
  if (studentProfile.academic_year !== groupPath.grade) {
    const gradeLabel = groupPath.grade === 'second_secondary'
      ? { ar: 'الصف الثاني الثانوي', en: 'Second Secondary' }
      : { ar: 'الصف الثالث الثانوي', en: 'Third Secondary' };
    
    return {
      allowed: false,
      message: `This group is for ${gradeLabel.en} students only`,
      messageAr: `هذه المجموعة مخصصة لطلاب ${gradeLabel.ar} فقط`,
    };
  }
  
  if (studentProfile.language_track !== groupPath.language_track) {
    const trackLabel = groupPath.language_track === 'arabic'
      ? { ar: 'المسار العربي', en: 'Arabic track' }
      : { ar: 'مسار اللغات', en: 'Languages track' };
    
    return {
      allowed: false,
      message: `This group is for ${trackLabel.en} students only`,
      messageAr: `هذه المجموعة مخصصة لطلاب ${trackLabel.ar} فقط`,
    };
  }
  
  return { allowed: true, message: '', messageAr: '' };
}

// Get formatted labels for academic paths
export const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
  'second_secondary': { ar: 'الصف الثاني الثانوي', en: 'Second Secondary' },
  'third_secondary': { ar: 'الصف الثالث الثانوي', en: 'Third Secondary' },
};

export const TRACK_LABELS: Record<string, { ar: string; en: string }> = {
  'arabic': { ar: 'عربي', en: 'Arabic' },
  'languages': { ar: 'لغات', en: 'Languages' },
};

export const COMBINED_GRADE_LABELS: Record<string, { ar: string; en: string }> = {
  'second_arabic': { ar: 'ثانية ثانوي عربي', en: '2nd Year - Arabic' },
  'second_languages': { ar: 'ثانية ثانوي لغات', en: '2nd Year - Languages' },
  'third_arabic': { ar: 'ثالثة ثانوي عربي', en: '3rd Year - Arabic' },
  'third_languages': { ar: 'ثالثة ثانوي لغات', en: '3rd Year - Languages' },
};

export function getAcademicPathLabel(
  grade: string | null,
  track: string | null,
  isArabic: boolean
): string {
  if (!grade) return isArabic ? 'غير محدد' : 'Not specified';
  
  const gradeLabel = GRADE_LABELS[grade];
  const trackLabel = track ? TRACK_LABELS[track] : null;
  
  if (!gradeLabel) return isArabic ? 'غير محدد' : 'Not specified';
  
  const gradeName = isArabic ? gradeLabel.ar : gradeLabel.en;
  const trackName = trackLabel ? (isArabic ? trackLabel.ar : trackLabel.en) : '';
  
  return trackName ? `${gradeName} - ${trackName}` : gradeName;
}
