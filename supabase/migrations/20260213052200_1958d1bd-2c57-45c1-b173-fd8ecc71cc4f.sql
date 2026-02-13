-- Add column to store AI-generated infographic image URLs (array of URLs)
ALTER TABLE public.lesson_ai_content 
ADD COLUMN IF NOT EXISTS infographic_images jsonb DEFAULT NULL;

-- This stores an array of objects like:
-- [{ "url": "https://...", "title": "concept map", "type": "concept" }]
-- Generated once per lesson, cached indefinitely