-- Add optional video_url column to lessons table for external video content (e.g., YouTube)
ALTER TABLE public.lessons
ADD COLUMN video_url TEXT DEFAULT NULL;