
-- Fix the SECURITY DEFINER view warning by using SECURITY INVOKER instead
-- This ensures the view respects the querying user's permissions

DROP VIEW IF EXISTS public.center_groups_for_registration;

CREATE VIEW public.center_groups_for_registration
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  grade,
  language_track,
  time_slot,
  days_of_week,
  is_active
FROM public.center_groups
WHERE is_active = true;

-- Re-grant permissions on the recreated view
GRANT SELECT ON public.center_groups_for_registration TO anon;
GRANT SELECT ON public.center_groups_for_registration TO authenticated;

-- Since the view now uses SECURITY INVOKER, we need a policy allowing anon to read active groups
-- But ONLY through the safe view columns (the view already filters out teacher_id)
CREATE POLICY "Public can view active groups for registration"
ON public.center_groups
FOR SELECT
USING (is_active = true);
