-- Create center_groups table for physical class groups
CREATE TABLE public.center_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade text NOT NULL,
  language_track text NOT NULL,
  days_of_week text[] NOT NULL DEFAULT '{}',
  time_slot time NOT NULL,
  assistant_teacher_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create center_group_members table for student enrollment in groups
CREATE TABLE public.center_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.center_groups(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(group_id, student_id)
);

-- Create center_sessions table for individual class occurrences
CREATE TABLE public.center_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.center_groups(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  session_time time NOT NULL,
  assistant_teacher_id uuid NOT NULL,
  notes text,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, session_date, session_time)
);

-- Create center_session_attendance table for attendance records
CREATE TABLE public.center_session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.center_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by uuid NOT NULL,
  marked_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(session_id, student_id)
);

-- Enable RLS on all tables
ALTER TABLE public.center_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_session_attendance ENABLE ROW LEVEL SECURITY;

-- RLS policies for center_groups
CREATE POLICY "Assistant teachers can manage center groups"
ON public.center_groups FOR ALL
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their assigned groups"
ON public.center_groups FOR SELECT
USING (
  id IN (
    SELECT group_id FROM public.center_group_members 
    WHERE student_id = auth.uid() AND is_active = true
  )
);

-- RLS policies for center_group_members
CREATE POLICY "Assistant teachers can manage group members"
ON public.center_group_members FOR ALL
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own memberships"
ON public.center_group_members FOR SELECT
USING (student_id = auth.uid());

-- RLS policies for center_sessions
CREATE POLICY "Assistant teachers can manage sessions"
ON public.center_sessions FOR ALL
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view sessions for their groups"
ON public.center_sessions FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.center_group_members 
    WHERE student_id = auth.uid() AND is_active = true
  )
);

-- RLS policies for center_session_attendance
CREATE POLICY "Assistant teachers can manage attendance"
ON public.center_session_attendance FOR ALL
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own attendance"
ON public.center_session_attendance FOR SELECT
USING (student_id = auth.uid());

-- Create updated_at trigger for center_groups
CREATE TRIGGER update_center_groups_updated_at
BEFORE UPDATE ON public.center_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_center_group_members_group_id ON public.center_group_members(group_id);
CREATE INDEX idx_center_group_members_student_id ON public.center_group_members(student_id);
CREATE INDEX idx_center_sessions_group_id ON public.center_sessions(group_id);
CREATE INDEX idx_center_sessions_date ON public.center_sessions(session_date);
CREATE INDEX idx_center_session_attendance_session_id ON public.center_session_attendance(session_id);
CREATE INDEX idx_center_session_attendance_student_id ON public.center_session_attendance(student_id);