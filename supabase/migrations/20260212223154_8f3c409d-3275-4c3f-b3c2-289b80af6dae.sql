
-- Create table for AI-generated lesson content (support layer only - does NOT modify SSOT)
CREATE TABLE public.lesson_ai_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  summary_text TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  exam_tips JSONB DEFAULT '[]'::jsonb,
  infographic_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  video_url_hash TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_lesson_ai_content UNIQUE (lesson_id)
);

-- Enable RLS
ALTER TABLE public.lesson_ai_content ENABLE ROW LEVEL SECURITY;

-- Students can read AI content for any lesson they can access
CREATE POLICY "Anyone can read lesson AI content"
  ON public.lesson_ai_content
  FOR SELECT
  USING (true);

-- Only staff can insert/update AI content
CREATE POLICY "Staff can manage lesson AI content"
  ON public.lesson_ai_content
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'assistant_teacher')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'assistant_teacher')
  );

-- Service role can manage (for edge functions)
CREATE POLICY "Service role can manage lesson AI content"
  ON public.lesson_ai_content
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE TRIGGER update_lesson_ai_content_updated_at
  BEFORE UPDATE ON public.lesson_ai_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_lesson_ai_content_lesson_id ON public.lesson_ai_content(lesson_id);
CREATE INDEX idx_lesson_ai_content_status ON public.lesson_ai_content(status);
