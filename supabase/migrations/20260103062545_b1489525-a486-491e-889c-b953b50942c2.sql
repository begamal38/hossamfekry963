
-- Create a security definer function to check if an assistant can view a student's profile
-- Returns true if:
-- 1. User is an admin (full access)
-- 2. User is an assistant teacher AND:
--    a) The student is in one of their center groups, OR
--    b) No center groups exist yet (backward compatibility for initial setup)

CREATE OR REPLACE FUNCTION public.can_assistant_view_student(_assistant_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin can see everyone
    has_role(_assistant_id, 'admin')
    OR
    -- Assistant teacher can see students in their assigned groups
    (
      has_role(_assistant_id, 'assistant_teacher')
      AND (
        -- Student is in an active group managed by this assistant
        EXISTS (
          SELECT 1 
          FROM center_group_members cgm
          JOIN center_groups cg ON cg.id = cgm.group_id
          WHERE cgm.student_id = _student_id
            AND cgm.is_active = true
            AND cg.assistant_teacher_id = _assistant_id
        )
        OR
        -- Fallback: If assistant has no groups assigned, they can see students
        -- who are students (have student role) - this maintains backward compatibility
        NOT EXISTS (
          SELECT 1 
          FROM center_groups cg 
          WHERE cg.assistant_teacher_id = _assistant_id
        )
      )
    )
$$;

-- Drop the old permissive policy for assistant teachers viewing profiles
DROP POLICY IF EXISTS "Assistant teachers can view all profiles" ON public.profiles;

-- Create a new restricted policy for assistant teachers
-- They can only view profiles of students in their assigned center groups
CREATE POLICY "Assistant teachers can view assigned student profiles"
ON public.profiles
FOR SELECT
USING (
  -- User can always see their own profile
  auth.uid() = user_id
  OR
  -- Admin can see all profiles
  has_role(auth.uid(), 'admin')
  OR
  -- Assistant teacher can only see students they're assigned to
  can_assistant_view_student(auth.uid(), user_id)
);

-- Also update the UPDATE policy to be more restrictive
DROP POLICY IF EXISTS "Assistant teachers can update student attendance_mode" ON public.profiles;

CREATE POLICY "Assistant teachers can update assigned student profiles"
ON public.profiles
FOR UPDATE
USING (
  -- User can update their own profile
  auth.uid() = user_id
  OR
  -- Admin can update all profiles
  has_role(auth.uid(), 'admin')
  OR
  -- Assistant teacher can only update students they're assigned to
  can_assistant_view_student(auth.uid(), user_id)
)
WITH CHECK (
  auth.uid() = user_id
  OR
  has_role(auth.uid(), 'admin')
  OR
  can_assistant_view_student(auth.uid(), user_id)
);
