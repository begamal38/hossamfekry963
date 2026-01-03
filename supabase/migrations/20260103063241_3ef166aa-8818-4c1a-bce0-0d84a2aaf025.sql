-- Fix the can_assistant_view_student function to remove overly permissive fallback
-- Previously, assistants with no groups could see ALL students, which is a security issue

CREATE OR REPLACE FUNCTION public.can_assistant_view_student(_assistant_id uuid, _student_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    -- Admin can see everyone
    has_role(_assistant_id, 'admin')
    OR
    -- Assistant teacher can ONLY see students in their assigned groups
    (
      has_role(_assistant_id, 'assistant_teacher')
      AND EXISTS (
        SELECT 1 
        FROM center_group_members cgm
        JOIN center_groups cg ON cg.id = cgm.group_id
        WHERE cgm.student_id = _student_id
          AND cgm.is_active = true
          AND cg.assistant_teacher_id = _assistant_id
      )
    )
$function$;