-- Allow Google signups (and any signup) to create a profile with NULL attendance_mode until the user explicitly chooses.
ALTER TABLE public.profiles
  ALTER COLUMN attendance_mode DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN attendance_mode DROP NOT NULL;

-- Optional: ensure no lingering default gets reintroduced elsewhere
COMMENT ON COLUMN public.profiles.attendance_mode IS 'NULL until user explicitly selects online/center during profile completion; then becomes read-only for students.';
