-- Fix linter warnings: remove INSERT policies with WITH CHECK (true)

-- free_lesson_analytics
DROP POLICY IF EXISTS "Allow anonymous insert for tracking" ON public.free_lesson_analytics;

CREATE POLICY "Allow anonymous insert for tracking"
ON public.free_lesson_analytics
FOR INSERT
TO public
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- platform_consent_events
DROP POLICY IF EXISTS "Anyone can insert consent events" ON public.platform_consent_events;

CREATE POLICY "Anyone can insert consent events"
ON public.platform_consent_events
FOR INSERT
TO public
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);
