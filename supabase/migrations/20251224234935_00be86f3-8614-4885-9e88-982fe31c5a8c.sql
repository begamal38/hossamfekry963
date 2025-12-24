-- تنظيف أعمدة OTP غير المستخدمة من profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_otp;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_otp_expires_at;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_verified;

-- إنشاء Enum للأدوار
CREATE TYPE public.app_role AS ENUM ('admin', 'assistant_teacher', 'student');

-- إنشاء جدول الأدوار
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- تفعيل RLS على جدول الأدوار
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- دالة للتحقق من الصلاحيات (Security Definer لتجنب RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- سياسات RLS لجدول user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- تحديث جدول course_enrollments
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS activated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- سماح للمدرسين المساعدين بقراءة جميع الـ profiles
CREATE POLICY "Assistant teachers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'assistant_teacher') OR public.has_role(auth.uid(), 'admin'));

-- سماح للمدرسين المساعدين بقراءة جميع الاشتراكات
CREATE POLICY "Assistant teachers can view all enrollments"
ON public.course_enrollments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'assistant_teacher') OR public.has_role(auth.uid(), 'admin'));

-- سماح للمدرسين المساعدين بتحديث الاشتراكات (تفعيل/إلغاء)
CREATE POLICY "Assistant teachers can update enrollments"
ON public.course_enrollments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'assistant_teacher') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'assistant_teacher') OR public.has_role(auth.uid(), 'admin'));