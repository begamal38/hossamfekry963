
-- Fix: Remove overly permissive public policy and use a secure function instead
-- RLS is row-level, not column-level, so we need a SECURITY DEFINER function

-- 1. Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view active groups for registration" ON public.center_groups;

-- 2. Drop the view (we'll use a function instead for better security)
DROP VIEW IF EXISTS public.center_groups_for_registration;

-- 3. Create a SECURITY DEFINER function that returns ONLY safe registration data
CREATE OR REPLACE FUNCTION public.get_center_groups_for_registration(
  p_grade TEXT,
  p_language_track TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  grade TEXT,
  language_track TEXT,
  time_slot TEXT,
  days_of_week TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cg.id,
    cg.name,
    cg.grade,
    cg.language_track,
    cg.time_slot,
    cg.days_of_week
    -- NOTE: assistant_teacher_id is EXCLUDED
  FROM public.center_groups cg
  WHERE cg.is_active = true
    AND cg.grade = p_grade
    AND cg.language_track = p_language_track
  ORDER BY cg.name;
$$;

-- 4. Grant execute to both anon (for registration) and authenticated users
GRANT EXECUTE ON FUNCTION public.get_center_groups_for_registration(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_center_groups_for_registration(TEXT, TEXT) TO authenticated;
