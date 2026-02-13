
-- Add revision_notes column for exam-focused revision text
ALTER TABLE public.lesson_ai_content 
ADD COLUMN IF NOT EXISTS revision_notes text;
