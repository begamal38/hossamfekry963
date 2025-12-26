
-- إزالة قيد المفتاح الأجنبي مؤقتاً للسماح ببيانات تجريبية
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
