-- ══════════════════════════════════════════════════════════════════════════
-- PRACTICE QUESTIONS SYSTEM (Additive - Optional layer for lessons)
-- ══════════════════════════════════════════════════════════════════════════

-- Create enum for question types
CREATE TYPE public.question_type AS ENUM ('mcq', 'true_false');

-- Practice questions table linked to lessons
CREATE TABLE public.practice_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_ar TEXT NOT NULL,
  question_type public.question_type NOT NULL DEFAULT 'mcq',
  options JSONB, -- For MCQ: [{text: "...", text_ar: "...", is_correct: true/false}]
  correct_answer BOOLEAN, -- For true/false questions
  explanation TEXT,
  explanation_ar TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Practice attempts table - tracks student practice
CREATE TABLE public.practice_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.practice_questions(id) ON DELETE CASCADE,
  selected_option INTEGER, -- Index of selected option for MCQ
  selected_answer BOOLEAN, -- For true/false
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_questions
CREATE POLICY "Practice questions are viewable by everyone"
ON public.practice_questions FOR SELECT
USING (true);

CREATE POLICY "Assistant teachers can insert practice questions"
ON public.practice_questions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can update practice questions"
ON public.practice_questions FOR UPDATE
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can delete practice questions"
ON public.practice_questions FOR DELETE
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for practice_attempts
CREATE POLICY "Users can view their own practice attempts"
ON public.practice_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice attempts"
ON public.practice_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Assistant teachers can view all practice attempts"
ON public.practice_attempts FOR SELECT
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- ══════════════════════════════════════════════════════════════════════════
-- STRUCTURED Q&A SYSTEM (Lesson-linked questions)
-- ══════════════════════════════════════════════════════════════════════════

-- Lesson questions from students
CREATE TABLE public.lesson_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_answered BOOLEAN DEFAULT false
);

-- Answers from assistant teachers
CREATE TABLE public.lesson_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.lesson_questions(id) ON DELETE CASCADE,
  answered_by UUID NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_questions
CREATE POLICY "Users can view questions in their enrolled courses"
ON public.lesson_questions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can ask questions"
ON public.lesson_questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions"
ON public.lesson_questions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Assistant teachers can update questions"
ON public.lesson_questions FOR UPDATE
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for lesson_answers
CREATE POLICY "Everyone can view answers"
ON public.lesson_answers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Assistant teachers can answer questions"
ON public.lesson_answers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can update answers"
ON public.lesson_answers FOR UPDATE
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can delete answers"
ON public.lesson_answers FOR DELETE
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- ══════════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ══════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_practice_questions_lesson ON public.practice_questions(lesson_id);
CREATE INDEX idx_practice_attempts_user ON public.practice_attempts(user_id);
CREATE INDEX idx_practice_attempts_question ON public.practice_attempts(question_id);
CREATE INDEX idx_lesson_questions_lesson ON public.lesson_questions(lesson_id);
CREATE INDEX idx_lesson_questions_user ON public.lesson_questions(user_id);
CREATE INDEX idx_lesson_answers_question ON public.lesson_answers(question_id);