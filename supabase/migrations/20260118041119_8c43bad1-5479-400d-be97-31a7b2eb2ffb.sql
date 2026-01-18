-- ملاحظة: محاولة تغيير نوع user_id إلى UUID فشلت بسبب اعتماد سياسات RLS على أعمدة user_id في جداول أخرى.
-- لذلك سنبقي الأنواع كما هي (TEXT) ونؤمّن النظام عبر:
-- 1) تنظيف Orphans دورياً/عند الطلب
-- 2) فرض "دور واحد لكل مستخدم" داخل user_roles

-- 1) Enforce single role per user (TEXT user_id) + clean duplicates safely
WITH ranked AS (
  SELECT
    id,
    user_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY CASE role
        WHEN 'admin' THEN 1
        WHEN 'assistant_teacher' THEN 2
        WHEN 'student' THEN 3
        ELSE 99
      END, created_at ASC
    ) AS rn
  FROM public.user_roles
)
DELETE FROM public.user_roles ur
USING ranked r
WHERE ur.id = r.id
  AND r.rn > 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_id_role_key'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_role_key;
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_one_role_per_user'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_one_role_per_user UNIQUE (user_id);
  END IF;
END $$;

-- 2) Cleanup function for orphaned rows (runs with elevated privileges)
CREATE OR REPLACE FUNCTION public.cleanup_orphan_user_rows()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles int := 0;
  v_profiles int := 0;
  v_permissions int := 0;
  v_sessions int := 0;
  v_devices int := 0;
BEGIN
  -- user_roles
  WITH del AS (
    DELETE FROM public.user_roles ur
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = ur.user_id::uuid
    )
    RETURNING 1
  ) SELECT COUNT(*) INTO v_roles FROM del;

  -- profiles
  WITH del AS (
    DELETE FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = p.user_id::uuid
    )
    RETURNING 1
  ) SELECT COUNT(*) INTO v_profiles FROM del;

  -- assistant_teacher_permissions
  WITH del AS (
    DELETE FROM public.assistant_teacher_permissions atp
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = atp.user_id::uuid
    )
    RETURNING 1
  ) SELECT COUNT(*) INTO v_permissions FROM del;

  -- user_sessions
  WITH del AS (
    DELETE FROM public.user_sessions us
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = us.user_id::uuid
    )
    RETURNING 1
  ) SELECT COUNT(*) INTO v_sessions FROM del;

  -- user_devices
  WITH del AS (
    DELETE FROM public.user_devices ud
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = ud.user_id::uuid
    )
    RETURNING 1
  ) SELECT COUNT(*) INTO v_devices FROM del;

  RETURN json_build_object(
    'deleted_user_roles', v_roles,
    'deleted_profiles', v_profiles,
    'deleted_assistant_teacher_permissions', v_permissions,
    'deleted_user_sessions', v_sessions,
    'deleted_user_devices', v_devices
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_orphan_user_rows() FROM public;
GRANT EXECUTE ON FUNCTION public.cleanup_orphan_user_rows() TO authenticated;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
