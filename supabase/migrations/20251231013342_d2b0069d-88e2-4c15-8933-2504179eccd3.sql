-- Add chapter_id to exams table (exams are now linked to chapters)
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL;

-- Create exam_questions table for MCQ questions
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option char(1) NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create exam_attempts table to track student attempts
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  is_completed boolean NOT NULL DEFAULT false
);

-- Create unique constraint to prevent multiple completed attempts per exam per user
CREATE UNIQUE INDEX IF NOT EXISTS exam_attempts_user_exam_completed_idx 
  ON public.exam_attempts(user_id, exam_id) 
  WHERE is_completed = true;

-- Enable RLS on new tables
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

-- RLS for exam_questions: viewable by everyone, manageable by assistant teachers
CREATE POLICY "Exam questions are viewable by everyone" 
  ON public.exam_questions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Assistant teachers can insert exam questions" 
  ON public.exam_questions 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can update exam questions" 
  ON public.exam_questions 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can delete exam questions" 
  ON public.exam_questions 
  FOR DELETE 
  USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- RLS for exam_attempts
CREATE POLICY "Users can view their own attempts" 
  ON public.exam_attempts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" 
  ON public.exam_attempts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts" 
  ON public.exam_attempts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Assistant teachers can view all attempts" 
  ON public.exam_attempts 
  FOR SELECT 
  USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_exam ON public.exam_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exams_chapter_id ON public.exams(chapter_id);