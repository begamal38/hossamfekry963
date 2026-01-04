-- Free lesson analytics tracking table
CREATE TABLE public.free_lesson_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_id UUID,
  preview_seconds INTEGER DEFAULT 0,
  view_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_ended_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  enrolled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.free_lesson_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts for tracking (visitor analytics)
CREATE POLICY "Allow anonymous insert for tracking" 
ON public.free_lesson_analytics 
FOR INSERT 
WITH CHECK (true);

-- Policy: Allow updates to own session data
CREATE POLICY "Allow updates to own session" 
ON public.free_lesson_analytics 
FOR UPDATE 
USING (session_id = session_id);

-- Policy: Only staff can view analytics
CREATE POLICY "Staff can view all analytics" 
ON public.free_lesson_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'assistant_teacher')
  )
);

-- Index for efficient queries
CREATE INDEX idx_free_lesson_analytics_lesson_id ON public.free_lesson_analytics(lesson_id);
CREATE INDEX idx_free_lesson_analytics_session_id ON public.free_lesson_analytics(session_id);
CREATE INDEX idx_free_lesson_analytics_created_at ON public.free_lesson_analytics(created_at DESC);