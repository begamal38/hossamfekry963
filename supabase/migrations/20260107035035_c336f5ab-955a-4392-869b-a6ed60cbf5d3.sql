-- 1. Add is_hidden column to courses table (Course Visibility Control)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- 2. Create chapter_enrollments table for chapter-based subscriptions
CREATE TABLE IF NOT EXISTS public.chapter_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired')),
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  activated_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- 3. Enable RLS on chapter_enrollments
ALTER TABLE public.chapter_enrollments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for chapter_enrollments

-- Students can view their own chapter enrollments
CREATE POLICY "Students can view their own chapter enrollments"
ON public.chapter_enrollments
FOR SELECT
USING (auth.uid() = user_id);

-- Staff (admin/assistant_teacher) can view all chapter enrollments
CREATE POLICY "Staff can view all chapter enrollments"
ON public.chapter_enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'assistant_teacher')
  )
);

-- Staff can insert chapter enrollments
CREATE POLICY "Staff can insert chapter enrollments"
ON public.chapter_enrollments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'assistant_teacher')
  )
);

-- Staff can update chapter enrollments
CREATE POLICY "Staff can update chapter enrollments"
ON public.chapter_enrollments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'assistant_teacher')
  )
);

-- Staff can delete chapter enrollments
CREATE POLICY "Staff can delete chapter enrollments"
ON public.chapter_enrollments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'assistant_teacher')
  )
);

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_chapter_enrollments_user_id ON public.chapter_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_enrollments_chapter_id ON public.chapter_enrollments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_enrollments_course_id ON public.chapter_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_chapter_enrollments_status ON public.chapter_enrollments(status);

-- 6. Index for is_hidden courses filter
CREATE INDEX IF NOT EXISTS idx_courses_is_hidden ON public.courses(is_hidden);