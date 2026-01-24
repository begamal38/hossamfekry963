
-- Fix: Create a safe public view for registration without exposing teacher IDs
-- Keep full access for authenticated users and staff

-- 1. Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view active center groups for registration" ON public.center_groups;

-- 2. Create a safe view for registration (public, excludes sensitive data)
CREATE OR REPLACE VIEW public.center_groups_for_registration AS
SELECT 
  id,
  name,
  grade,
  language_track,
  time_slot,
  days_of_week,
  is_active
  -- NOTE: assistant_teacher_id is EXCLUDED for privacy
FROM public.center_groups
WHERE is_active = true;

-- 3. Grant SELECT on safe view to anonymous and authenticated users
GRANT SELECT ON public.center_groups_for_registration TO anon;
GRANT SELECT ON public.center_groups_for_registration TO authenticated;

-- 4. Create policy for authenticated students to view groups they're members of
CREATE POLICY "Students can view groups they belong to"
ON public.center_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.center_group_members cgm
    WHERE cgm.group_id = center_groups.id
    AND cgm.student_id = auth.uid()
  )
);

-- 5. Staff can view all center groups (already have access via other policies, but ensure it)
CREATE POLICY "Staff can view all center groups"
ON public.center_groups
FOR SELECT
USING (
  has_role(auth.uid(), 'assistant_teacher'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);
