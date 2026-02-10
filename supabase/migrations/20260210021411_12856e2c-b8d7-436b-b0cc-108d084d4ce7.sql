
-- ============================================================
-- PART 1: Lesson Activation Control
-- ============================================================
-- Add is_active to lessons (default true = all existing lessons stay visible)
ALTER TABLE public.lessons ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- PART 2: Assistant Notifications Table
-- ============================================================
CREATE TABLE public.assistant_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  student_id UUID,
  student_name TEXT,
  course_id UUID REFERENCES public.courses(id),
  lesson_id UUID REFERENCES public.lessons(id),
  exam_id UUID REFERENCES public.exams(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assistant_notifications ENABLE ROW LEVEL SECURITY;

-- Staff can view
CREATE POLICY "Staff can view assistant notifications"
ON public.assistant_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('assistant_teacher', 'admin')
  )
);

-- Anyone authenticated can insert (triggers run as SECURITY DEFINER)
CREATE POLICY "System can insert assistant notifications"
ON public.assistant_notifications FOR INSERT
WITH CHECK (true);

-- Staff can update (mark as read)
CREATE POLICY "Staff can update assistant notifications"
ON public.assistant_notifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('assistant_teacher', 'admin')
  )
);

-- Index for fast queries
CREATE INDEX idx_assistant_notifications_created ON public.assistant_notifications(created_at DESC);
CREATE INDEX idx_assistant_notifications_read ON public.assistant_notifications(is_read) WHERE is_read = false;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.assistant_notifications;

-- ============================================================
-- PART 3: DB Triggers for Event-Driven Assistant Notifications
-- ============================================================

-- Trigger 1: New student profile created
CREATE OR REPLACE FUNCTION public.notify_assistant_new_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only for students (not staff)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = NEW.user_id AND role IN ('assistant_teacher', 'admin')
  ) THEN
    INSERT INTO assistant_notifications (event_type, message_ar, student_id, student_name)
    VALUES ('new_student', 'طالب جديد انضم للمنصة: ' || COALESCE(NEW.full_name, 'بدون اسم'), NEW.user_id, NEW.full_name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_student_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_assistant_new_student();

-- Trigger 2: Student completes profile
CREATE OR REPLACE FUNCTION public.notify_assistant_profile_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if profile just became complete (key fields filled)
  IF (OLD.full_name IS NULL OR OLD.grade IS NULL OR OLD.phone IS NULL)
     AND NEW.full_name IS NOT NULL AND NEW.grade IS NOT NULL AND NEW.phone IS NOT NULL
  THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = NEW.user_id AND role IN ('assistant_teacher', 'admin')
    ) THEN
      INSERT INTO assistant_notifications (event_type, message_ar, student_id, student_name)
      VALUES ('profile_complete', 'طالب أكمل بياناته: ' || NEW.full_name, NEW.user_id, NEW.full_name);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_complete
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_assistant_profile_complete();

-- Trigger 3: Student enrolled in course
CREATE OR REPLACE FUNCTION public.notify_assistant_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student_name TEXT;
  v_course_title TEXT;
BEGIN
  SELECT full_name INTO v_student_name FROM profiles WHERE user_id = NEW.user_id;
  SELECT title_ar INTO v_course_title FROM courses WHERE id = NEW.course_id;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = NEW.user_id AND role IN ('assistant_teacher', 'admin')
  ) THEN
    INSERT INTO assistant_notifications (event_type, message_ar, student_id, student_name, course_id)
    VALUES ('enrollment', COALESCE(v_student_name, 'طالب') || ' اشترك في: ' || COALESCE(v_course_title, 'كورس'), NEW.user_id, v_student_name, NEW.course_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_student_enrollment
AFTER INSERT ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.notify_assistant_enrollment();

-- Trigger 4: Student completes a lesson
CREATE OR REPLACE FUNCTION public.notify_assistant_lesson_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student_name TEXT;
  v_lesson_title TEXT;
  v_course_id UUID;
BEGIN
  SELECT full_name INTO v_student_name FROM profiles WHERE user_id = NEW.user_id;
  SELECT title_ar, course_id INTO v_lesson_title, v_course_id FROM lessons WHERE id = NEW.lesson_id;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = NEW.user_id AND role IN ('assistant_teacher', 'admin')
  ) THEN
    INSERT INTO assistant_notifications (event_type, message_ar, student_id, student_name, course_id, lesson_id)
    VALUES ('lesson_complete', COALESCE(v_student_name, 'طالب') || ' أكمل حصة: ' || COALESCE(v_lesson_title, ''), NEW.user_id, v_student_name, v_course_id, NEW.lesson_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lesson_complete
AFTER INSERT ON public.lesson_completions
FOR EACH ROW
EXECUTE FUNCTION public.notify_assistant_lesson_complete();

-- Trigger 5: Student attempts/completes exam
CREATE OR REPLACE FUNCTION public.notify_assistant_exam_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student_name TEXT;
  v_exam_title TEXT;
  v_course_id UUID;
BEGIN
  SELECT full_name INTO v_student_name FROM profiles WHERE user_id = NEW.user_id;
  SELECT title_ar, course_id INTO v_exam_title, v_course_id FROM exams WHERE id = NEW.exam_id;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = NEW.user_id AND role IN ('assistant_teacher', 'admin')
  ) THEN
    IF NEW.is_completed THEN
      INSERT INTO assistant_notifications (event_type, message_ar, student_id, student_name, course_id, exam_id)
      VALUES ('exam_complete', COALESCE(v_student_name, 'طالب') || ' أنهى امتحان: ' || COALESCE(v_exam_title, '') || ' — الدرجة: ' || NEW.score::text, NEW.user_id, v_student_name, v_course_id, NEW.exam_id);
    ELSE
      INSERT INTO assistant_notifications (event_type, message_ar, student_id, student_name, course_id, exam_id)
      VALUES ('exam_start', COALESCE(v_student_name, 'طالب') || ' بدأ امتحان: ' || COALESCE(v_exam_title, ''), NEW.user_id, v_student_name, v_course_id, NEW.exam_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_exam_attempt
AFTER INSERT ON public.exam_attempts
FOR EACH ROW
EXECUTE FUNCTION public.notify_assistant_exam_attempt();
