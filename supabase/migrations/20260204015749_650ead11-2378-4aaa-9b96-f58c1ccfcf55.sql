-- Fix security warnings for install_events

-- 1. Fix function search_path
CREATE OR REPLACE FUNCTION public.get_install_statistics()
RETURNS TABLE (
  total_installs BIGINT,
  android_installs BIGINT,
  ios_installs BIGINT,
  windows_installs BIGINT,
  macos_installs BIGINT,
  other_installs BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_installs,
    COUNT(*) FILTER (WHERE device_type = 'android')::BIGINT as android_installs,
    COUNT(*) FILTER (WHERE device_type = 'ios')::BIGINT as ios_installs,
    COUNT(*) FILTER (WHERE device_type = 'windows')::BIGINT as windows_installs,
    COUNT(*) FILTER (WHERE device_type = 'macos')::BIGINT as macos_installs,
    COUNT(*) FILTER (WHERE device_type NOT IN ('android', 'ios', 'windows', 'macos'))::BIGINT as other_installs
  FROM public.install_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update RLS policy to be more restrictive for inserts
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can record install events" ON public.install_events;

-- Create a more controlled insert policy
-- Allow inserts but with rate limiting via session_id uniqueness check in app layer
-- This is acceptable because install events are anonymous analytics data
-- The policy ensures only valid device types can be inserted (via CHECK constraint)
CREATE POLICY "Allow install event recording with valid data"
ON public.install_events
FOR INSERT
WITH CHECK (
  device_type IS NOT NULL 
  AND device_type IN ('android', 'ios', 'windows', 'macos', 'linux', 'unknown')
);