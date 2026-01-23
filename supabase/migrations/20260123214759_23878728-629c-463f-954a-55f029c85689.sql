-- Add study_mode_confirmed column to track explicit user choice
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS study_mode_confirmed BOOLEAN DEFAULT false;

-- Mark existing CENTER students with valid membership as confirmed
UPDATE profiles p
SET study_mode_confirmed = true
WHERE p.attendance_mode = 'center'
AND EXISTS (
  SELECT 1 FROM center_group_members cgm
  WHERE cgm.student_id = p.user_id
  AND cgm.is_active = true
);

-- Mark students who signed up AFTER the new flow (created recently) as needing confirmation
-- We'll let the code handle the logic based on study_mode_confirmed = false