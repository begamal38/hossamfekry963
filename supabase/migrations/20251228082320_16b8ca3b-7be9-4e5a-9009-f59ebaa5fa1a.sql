-- Add is_free_lesson column to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS is_free_lesson boolean NOT NULL DEFAULT false;

-- Create index for efficient free lessons queries
CREATE INDEX IF NOT EXISTS idx_lessons_is_free_lesson ON public.lessons(is_free_lesson) WHERE is_free_lesson = true;