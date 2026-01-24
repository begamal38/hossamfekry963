
-- ═══════════════════════════════════════════════════════════════════
-- DATA HYGIENE: RLS policies to ensure ONLY students can write progress data
-- This prevents analytics contamination from staff testing/observation
-- ═══════════════════════════════════════════════════════════════════

-- Drop existing insert policies that allow any authenticated user
DROP POLICY IF EXISTS "Users can insert their own completions" ON lesson_completions;
DROP POLICY IF EXISTS "Users can insert their own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert attempts for published exams" ON exam_attempts;

-- Create new STUDENT-ONLY insert policies for lesson_completions
CREATE POLICY "Students can insert their own completions" 
ON lesson_completions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'assistant_teacher')
  )
);

-- Create new STUDENT-ONLY insert policies for focus_sessions
CREATE POLICY "Students can insert their own focus sessions" 
ON focus_sessions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'assistant_teacher')
  )
);

-- Create new STUDENT-ONLY insert policies for exam_attempts
CREATE POLICY "Students can insert attempts for published exams" 
ON exam_attempts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'assistant_teacher')
  )
  AND EXISTS (
    SELECT 1 FROM exams 
    WHERE exams.id = exam_attempts.exam_id 
    AND exams.status = 'published'
  )
);

-- Also protect lesson_attendance from staff writes
DROP POLICY IF EXISTS "Users can insert their own attendance" ON lesson_attendance;
-- Note: lesson_attendance only has assistant teacher insert policies, which is fine for center attendance
-- For online attendance tracked from LessonView, we need a student-only policy
CREATE POLICY "Students can insert their own online attendance" 
ON lesson_attendance 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND attendance_type = 'online'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'assistant_teacher')
  )
);
