
-- Remove the overly permissive INSERT policy (triggers bypass RLS via SECURITY DEFINER)
DROP POLICY "System can insert assistant notifications" ON public.assistant_notifications;
