-- DATA REPAIR: Fix students who have center_group_members but NULL attendance_mode
UPDATE profiles p
SET attendance_mode = 'center'
WHERE p.attendance_mode IS NULL
AND EXISTS (
  SELECT 1 FROM center_group_members cgm
  WHERE cgm.student_id = p.user_id
  AND cgm.is_active = true
);