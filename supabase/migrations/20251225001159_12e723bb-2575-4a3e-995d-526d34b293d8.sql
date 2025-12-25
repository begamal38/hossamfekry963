-- جدول الدروس
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  lesson_type TEXT NOT NULL DEFAULT 'online' CHECK (lesson_type IN ('online', 'center')),
  duration_minutes INTEGER DEFAULT 60,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول حضور الدروس
CREATE TABLE public.lesson_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  attended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- جدول الامتحانات
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 100,
  exam_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول نتائج الامتحانات
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exam_id)
);

-- تفعيل RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- سياسات الدروس (الكل يشوف)
CREATE POLICY "Lessons are viewable by everyone" ON public.lessons
  FOR SELECT USING (true);

-- سياسات حضور الدروس
CREATE POLICY "Users can view their own attendance" ON public.lesson_attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Assistant teachers can view all attendance" ON public.lesson_attendance
  FOR SELECT USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can insert attendance" ON public.lesson_attendance
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can update attendance" ON public.lesson_attendance
  FOR UPDATE USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can delete attendance" ON public.lesson_attendance
  FOR DELETE USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- سياسات الامتحانات (الكل يشوف)
CREATE POLICY "Exams are viewable by everyone" ON public.exams
  FOR SELECT USING (true);

-- سياسات نتائج الامتحانات
CREATE POLICY "Users can view their own results" ON public.exam_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Assistant teachers can view all results" ON public.exam_results
  FOR SELECT USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can insert results" ON public.exam_results
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can update results" ON public.exam_results
  FOR UPDATE USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can delete results" ON public.exam_results
  FOR DELETE USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));