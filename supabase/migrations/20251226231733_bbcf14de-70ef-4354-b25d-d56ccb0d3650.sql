-- Create student_notes table for internal notes (visible to assistants only)
CREATE TABLE public.student_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  assistant_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assistant_action_logs table for logging all assistant actions
CREATE TABLE public.assistant_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id UUID NOT NULL,
  student_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add is_suspended column to profiles (default false)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_notes (only assistants can CRUD)
CREATE POLICY "Assistant teachers can view all student notes"
ON public.student_notes FOR SELECT
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can insert student notes"
ON public.student_notes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can update their own notes"
ON public.student_notes FOR UPDATE
USING ((has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin')) AND assistant_id = auth.uid());

CREATE POLICY "Assistant teachers can delete their own notes"
ON public.student_notes FOR DELETE
USING ((has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin')) AND assistant_id = auth.uid());

-- RLS policies for assistant_action_logs (only assistants can view and insert)
CREATE POLICY "Assistant teachers can view all action logs"
ON public.assistant_action_logs FOR SELECT
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can insert action logs"
ON public.assistant_action_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));