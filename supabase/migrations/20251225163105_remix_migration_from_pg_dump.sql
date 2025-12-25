CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'assistant_teacher',
    'student'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, grade, academic_year, language_track)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'grade',
    new.raw_user_meta_data ->> 'academic_year',
    new.raw_user_meta_data ->> 'language_track'
  );
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    progress integer DEFAULT 0,
    completed_lessons integer DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    activated_by uuid,
    activated_at timestamp with time zone
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    title_ar text NOT NULL,
    description text,
    description_ar text,
    grade text NOT NULL,
    thumbnail_url text,
    price numeric(10,2) DEFAULT 0,
    is_free boolean DEFAULT false,
    lessons_count integer DEFAULT 0,
    duration_hours integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exam_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exam_id uuid NOT NULL,
    score integer NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title text NOT NULL,
    title_ar text NOT NULL,
    max_score integer DEFAULT 100 NOT NULL,
    exam_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lesson_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    attended_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title text NOT NULL,
    title_ar text NOT NULL,
    lesson_type text DEFAULT 'online'::text NOT NULL,
    duration_minutes integer DEFAULT 60,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lessons_lesson_type_check CHECK ((lesson_type = ANY (ARRAY['online'::text, 'center'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    grade text,
    academic_year text,
    language_track text,
    CONSTRAINT check_academic_year CHECK (((academic_year IS NULL) OR (academic_year = ANY (ARRAY['second_secondary'::text, 'third_secondary'::text])))),
    CONSTRAINT check_language_track CHECK (((language_track IS NULL) OR (language_track = ANY (ARRAY['arabic'::text, 'languages'::text]))))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);


--
-- Name: course_enrollments course_enrollments_user_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_user_id_course_id_key UNIQUE (user_id, course_id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: exam_results exam_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_results
    ADD CONSTRAINT exam_results_pkey PRIMARY KEY (id);


--
-- Name: exam_results exam_results_user_id_exam_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_results
    ADD CONSTRAINT exam_results_user_id_exam_id_key UNIQUE (user_id, exam_id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: lesson_attendance lesson_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attendance
    ADD CONSTRAINT lesson_attendance_pkey PRIMARY KEY (id);


--
-- Name: lesson_attendance lesson_attendance_user_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attendance
    ADD CONSTRAINT lesson_attendance_user_id_lesson_id_key UNIQUE (user_id, lesson_id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_profiles_academic_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_academic_group ON public.profiles USING btree (academic_year, language_track);


--
-- Name: idx_profiles_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone);


--
-- Name: courses update_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: course_enrollments course_enrollments_activated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_activated_by_fkey FOREIGN KEY (activated_by) REFERENCES auth.users(id);


--
-- Name: course_enrollments course_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: exam_results exam_results_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_results
    ADD CONSTRAINT exam_results_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: exams exams_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: lesson_attendance lesson_attendance_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attendance
    ADD CONSTRAINT lesson_attendance_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lesson_attendance Assistant teachers can delete attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can delete attendance" ON public.lesson_attendance FOR DELETE USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: exams Assistant teachers can delete exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can delete exams" ON public.exams FOR DELETE USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lessons Assistant teachers can delete lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can delete lessons" ON public.lessons FOR DELETE USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: exam_results Assistant teachers can delete results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can delete results" ON public.exam_results FOR DELETE USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lesson_attendance Assistant teachers can insert attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can insert attendance" ON public.lesson_attendance FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: exams Assistant teachers can insert exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can insert exams" ON public.exams FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lessons Assistant teachers can insert lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can insert lessons" ON public.lessons FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: exam_results Assistant teachers can insert results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can insert results" ON public.exam_results FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lesson_attendance Assistant teachers can update attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can update attendance" ON public.lesson_attendance FOR UPDATE USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: course_enrollments Assistant teachers can update enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can update enrollments" ON public.course_enrollments FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: exams Assistant teachers can update exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can update exams" ON public.exams FOR UPDATE USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lessons Assistant teachers can update lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can update lessons" ON public.lessons FOR UPDATE USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: exam_results Assistant teachers can update results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can update results" ON public.exam_results FOR UPDATE USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: lesson_attendance Assistant teachers can view all attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can view all attendance" ON public.lesson_attendance FOR SELECT USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: course_enrollments Assistant teachers can view all enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can view all enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Assistant teachers can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can view all profiles" ON public.profiles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: exam_results Assistant teachers can view all results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Assistant teachers can view all results" ON public.exam_results FOR SELECT USING ((public.has_role(auth.uid(), 'assistant_teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: courses Courses are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);


--
-- Name: exams Exams are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Exams are viewable by everyone" ON public.exams FOR SELECT USING (true);


--
-- Name: lessons Lessons are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lessons are viewable by everyone" ON public.lessons FOR SELECT USING (true);


--
-- Name: course_enrollments Users can enroll in courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can enroll in courses" ON public.course_enrollments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: course_enrollments Users can update their own enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own enrollments" ON public.course_enrollments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: lesson_attendance Users can view their own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own attendance" ON public.lesson_attendance FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: course_enrollments Users can view their own enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own enrollments" ON public.course_enrollments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: exam_results Users can view their own results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own results" ON public.exam_results FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: course_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: exam_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

--
-- Name: exams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;