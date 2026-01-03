-- Focus sessions table to persist focus tracking data
CREATE TABLE public.focus_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_active_seconds INTEGER NOT NULL DEFAULT 0,
  total_paused_seconds INTEGER NOT NULL DEFAULT 0,
  interruptions INTEGER NOT NULL DEFAULT 0,
  completed_segments INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Course activity summaries - frozen when course access ends
CREATE TABLE public.course_activity_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  frozen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  frozen_by UUID NOT NULL,
  
  -- Raw counts (internal)
  total_focus_sessions INTEGER NOT NULL DEFAULT 0,
  total_active_minutes INTEGER NOT NULL DEFAULT 0,
  total_paused_minutes INTEGER NOT NULL DEFAULT 0,
  lessons_accessed INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  chapters_accessed INTEGER NOT NULL DEFAULT 0,
  total_chapters INTEGER NOT NULL DEFAULT 0,
  learning_days INTEGER NOT NULL DEFAULT 0,
  avg_session_gap_hours NUMERIC,
  
  -- Calculated scores (human-readable)
  engagement_score TEXT NOT NULL CHECK (engagement_score IN ('low', 'medium', 'high')),
  coverage_percentage INTEGER NOT NULL CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
  coverage_label TEXT NOT NULL CHECK (coverage_label IN ('weak', 'fair', 'strong')),
  consistency_score TEXT NOT NULL CHECK (consistency_score IN ('low', 'medium', 'high')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_activity_summaries ENABLE ROW LEVEL SECURITY;

-- Focus sessions policies
CREATE POLICY "Users can insert their own focus sessions"
ON public.focus_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions"
ON public.focus_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own focus sessions"
ON public.focus_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Assistant teachers can view all focus sessions"
ON public.focus_sessions FOR SELECT
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- Course activity summaries policies
CREATE POLICY "Assistant teachers can insert summaries"
ON public.course_activity_summaries FOR INSERT
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can view all summaries"
ON public.course_activity_summaries FOR SELECT
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own summaries"
ON public.course_activity_summaries FOR SELECT
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_focus_sessions_user_lesson ON public.focus_sessions(user_id, lesson_id);
CREATE INDEX idx_focus_sessions_course ON public.focus_sessions(course_id);
CREATE INDEX idx_course_activity_summaries_user_course ON public.course_activity_summaries(user_id, course_id);