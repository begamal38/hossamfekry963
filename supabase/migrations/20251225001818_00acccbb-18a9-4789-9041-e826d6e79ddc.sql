-- السماح للمدرسين المساعدين بإدارة الدروس
CREATE POLICY "Assistant teachers can insert lessons" ON public.lessons
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can update lessons" ON public.lessons
  FOR UPDATE USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can delete lessons" ON public.lessons
  FOR DELETE USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- السماح للمدرسين المساعدين بإدارة الامتحانات
CREATE POLICY "Assistant teachers can insert exams" ON public.exams
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can update exams" ON public.exams
  FOR UPDATE USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Assistant teachers can delete exams" ON public.exams
  FOR DELETE USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));