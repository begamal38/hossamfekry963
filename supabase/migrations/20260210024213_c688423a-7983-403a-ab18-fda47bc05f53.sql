
-- Add announcement_sent flag to lessons table
-- Default false for new lessons, true for existing (already-visible) lessons
ALTER TABLE public.lessons 
ADD COLUMN announcement_sent BOOLEAN NOT NULL DEFAULT false;

-- Mark all existing active lessons as already announced (prevent re-notification)
UPDATE public.lessons SET announcement_sent = true WHERE is_active = true;
