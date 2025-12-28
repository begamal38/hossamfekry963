-- =====================================================
-- ENHANCEMENT: Add Chapters, Post-video content, Lesson progression
-- =====================================================

-- 1. Create chapters table (between courses and lessons)
CREATE TABLE public.chapters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Add chapter_id and post-video content to lessons
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS summary_ar TEXT,
ADD COLUMN IF NOT EXISTS key_points JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS assistant_notes TEXT,
ADD COLUMN IF NOT EXISTS assistant_notes_ar TEXT,
ADD COLUMN IF NOT EXISTS requires_previous_completion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_exam_pass BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS linked_exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL;

-- 3. Create lesson_completions table for tracking progress
CREATE TABLE public.lesson_completions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    watch_time_seconds INTEGER DEFAULT 0,
    UNIQUE(user_id, lesson_id)
);

-- 4. Enable RLS on new tables
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for chapters
CREATE POLICY "Chapters are viewable by everyone" 
ON public.chapters FOR SELECT 
USING (true);

CREATE POLICY "Assistant teachers can insert chapters" 
ON public.chapters FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can update chapters" 
ON public.chapters FOR UPDATE 
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can delete chapters" 
ON public.chapters FOR DELETE 
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- 6. RLS policies for lesson_completions
CREATE POLICY "Users can view their own completions" 
ON public.lesson_completions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions" 
ON public.lesson_completions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completions" 
ON public.lesson_completions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Assistant teachers can view all completions" 
ON public.lesson_completions FOR SELECT 
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- 7. Create trigger for chapters updated_at
CREATE TRIGGER update_chapters_updated_at
BEFORE UPDATE ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();