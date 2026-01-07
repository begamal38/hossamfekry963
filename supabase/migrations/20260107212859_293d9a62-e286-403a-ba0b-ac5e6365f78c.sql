-- Add 'suspended' as a valid status for course_enrollments
-- First, let's update the check constraint or add a comment for clarity
-- The status column is text, so we just need to use 'suspended' in code

-- Add suspended status support - no schema change needed since status is TEXT
-- Just adding a comment for documentation
COMMENT ON COLUMN public.course_enrollments.status IS 'Enrollment status: pending, active, suspended (manually paused), expired, cancelled';

-- Add expires_at column to course_enrollments for future use (optional feature)
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add suspended_at column to track when subscription was suspended
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add suspended_by column to track who suspended it
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS suspended_by UUID DEFAULT NULL;

-- Add suspended_reason column for notes
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS suspended_reason TEXT DEFAULT NULL;

-- Same for chapter_enrollments
COMMENT ON COLUMN public.chapter_enrollments.status IS 'Chapter enrollment status: pending, active, suspended (manually paused), expired';

-- Add suspended tracking columns to chapter_enrollments
ALTER TABLE public.chapter_enrollments 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.chapter_enrollments 
ADD COLUMN IF NOT EXISTS suspended_by UUID DEFAULT NULL;

ALTER TABLE public.chapter_enrollments 
ADD COLUMN IF NOT EXISTS suspended_reason TEXT DEFAULT NULL;

-- Create index for efficient status filtering
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON public.course_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_chapter_enrollments_status ON public.chapter_enrollments(status);