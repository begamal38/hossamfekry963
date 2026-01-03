-- Drop the restrictive policies on profiles table
DROP POLICY IF EXISTS "Assistant teachers can view assigned student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Assistant teachers can update assigned student profiles" ON public.profiles;

-- Create new policies that allow assistant teachers to view ALL student profiles
CREATE POLICY "Assistant teachers can view all student profiles"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'assistant_teacher')
);

-- Allow assistant teachers to update ALL student profiles
CREATE POLICY "Assistant teachers can update all student profiles"
ON public.profiles
FOR UPDATE
USING (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'assistant_teacher')
)
WITH CHECK (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'assistant_teacher')
);