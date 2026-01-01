-- Create exam status enum
CREATE TYPE public.exam_status AS ENUM ('draft', 'published', 'closed', 'archived');

-- Create question type enum (MCQ now, essay for future)
CREATE TYPE public.exam_question_type AS ENUM ('mcq', 'essay');

-- Add new columns to exams table
ALTER TABLE public.exams
ADD COLUMN IF NOT EXISTS status public.exam_status NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS pass_mark integer NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS time_limit_minutes integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_attempts integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS show_results boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Add new columns to exam_questions table
ALTER TABLE public.exam_questions
ADD COLUMN IF NOT EXISTS question_type public.exam_question_type NOT NULL DEFAULT 'mcq',
ADD COLUMN IF NOT EXISTS question_image_url text DEFAULT NULL;

-- Add index for faster queries on exam status
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_course_status ON public.exams(course_id, status);

-- Function to get exam attempts count for a specific exam
CREATE OR REPLACE FUNCTION public.get_exam_attempts_count(exam_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.exam_attempts
  WHERE exam_id = exam_uuid AND is_completed = true
$$;

-- Trigger to update updated_at on exams
CREATE OR REPLACE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS: Students can only see published exams
DROP POLICY IF EXISTS "Exams are viewable by everyone" ON public.exams;

CREATE POLICY "Published exams are viewable by everyone"
ON public.exams
FOR SELECT
USING (
  status = 'published' 
  OR has_role(auth.uid(), 'assistant_teacher') 
  OR has_role(auth.uid(), 'admin')
);

-- Users can only insert attempts for published exams
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.exam_attempts;

CREATE POLICY "Users can insert attempts for published exams"
ON public.exam_attempts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.exams 
    WHERE id = exam_id 
    AND status = 'published'
  )
);