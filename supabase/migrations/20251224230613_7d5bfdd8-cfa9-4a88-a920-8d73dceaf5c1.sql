-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  grade TEXT NOT NULL,
  thumbnail_url TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  lessons_count INTEGER DEFAULT 0,
  duration_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_enrollments table
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Courses are viewable by everyone
CREATE POLICY "Courses are viewable by everyone" 
ON public.courses 
FOR SELECT 
USING (true);

-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can enroll in courses
CREATE POLICY "Users can enroll in courses" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollment progress
CREATE POLICY "Users can update their own enrollments" 
ON public.course_enrollments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample courses for each grade
INSERT INTO public.courses (title, title_ar, description, description_ar, grade, is_free, lessons_count, duration_hours, price) VALUES
('Organic Chemistry Basics', 'أساسيات الكيمياء العضوية', 'Learn the fundamentals of organic chemistry', 'تعلم أساسيات الكيمياء العضوية من البداية', 'second_arabic', false, 24, 12, 200),
('Electrochemistry', 'الكيمياء الكهربائية', 'Complete electrochemistry course', 'دورة شاملة في الكيمياء الكهربائية', 'second_arabic', false, 18, 9, 180),
('Organic Chemistry - Languages', 'الكيمياء العضوية - لغات', 'Organic chemistry in English', 'دورة الكيمياء العضوية باللغة الإنجليزية', 'second_languages', false, 24, 12, 220),
('Electrochemistry - Languages', 'الكيمياء الكهربائية - لغات', 'Electrochemistry in English', 'الكيمياء الكهربائية باللغة الإنجليزية', 'second_languages', false, 18, 9, 200),
('Final Review - Organic', 'المراجعة النهائية - العضوية', 'Comprehensive final review for 3rd year', 'مراجعة نهائية شاملة للثانوية العامة', 'third_arabic', false, 30, 15, 300),
('Complete Chemistry Course', 'دورة الكيمياء الكاملة', 'Full chemistry course for Thanaweya', 'دورة كيمياء كاملة للثانوية العامة', 'third_arabic', false, 45, 22, 400),
('Final Review - Languages', 'المراجعة النهائية - لغات', 'Final review for languages section', 'مراجعة نهائية لقسم اللغات', 'third_languages', false, 30, 15, 320),
('Complete Chemistry - Languages', 'الكيمياء الكاملة - لغات', 'Full chemistry in English', 'دورة كيمياء كاملة باللغة الإنجليزية', 'third_languages', false, 45, 22, 450),
('Free Introduction', 'مقدمة مجانية', 'Free introductory lessons', 'دروس تعريفية مجانية', 'second_arabic', true, 5, 2, 0),
('Free Trial - 3rd Year', 'تجربة مجانية - ثالثة ثانوي', 'Free trial lessons for 3rd year', 'دروس تجريبية مجانية للصف الثالث', 'third_arabic', true, 5, 2, 0);