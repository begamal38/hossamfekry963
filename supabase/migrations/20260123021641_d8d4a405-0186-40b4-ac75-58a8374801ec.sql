-- CRITICAL FIX: Allow students to insert themselves into center groups
-- Currently only assistant_teachers can manage group members, but students need to join during signup

-- Add policy for students to insert their own membership
CREATE POLICY "Students can join center groups"
ON public.center_group_members
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Add policy for students to update their own membership (for reactivation)
CREATE POLICY "Students can update own membership"
ON public.center_group_members
FOR UPDATE
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- ONE-TIME DATA REPAIR: Fix existing students who selected groups but never got inserted
-- This handles students who tried to join before but the insert failed
INSERT INTO public.center_group_members (group_id, student_id, is_active, enrolled_at)
SELECT 
  cg.id as group_id,
  p.user_id as student_id,
  true as is_active,
  now() as enrolled_at
FROM public.profiles p
CROSS JOIN public.center_groups cg
WHERE p.attendance_mode = 'center'
  AND NOT EXISTS (
    SELECT 1 FROM public.center_group_members cgm
    WHERE cgm.student_id = p.user_id
    AND cgm.is_active = true
  )
  AND cg.is_active = true
LIMIT 0; -- Safety: Don't auto-insert without knowing which group they chose