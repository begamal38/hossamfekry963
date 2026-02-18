import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UpcomingExam {
  id: string;
  title: string;
  title_ar: string;
  exam_date: string | null;
  course_title: string;
  course_title_ar: string;
}

interface UpcomingExamsCardProps {
  isArabic: boolean;
}

export const UpcomingExamsCard: React.FC<UpcomingExamsCardProps> = ({ isArabic }) => {
  const { user } = useAuth();
  const [exams, setExams] = useState<UpcomingExam[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchExams = async () => {
      // Get user's enrolled course IDs
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) return;

      const courseIds = enrollments.map(e => e.course_id);

      // Get published exams for enrolled courses that haven't been attempted
      const { data: publishedExams } = await supabase
        .from('exams')
        .select('id, title, title_ar, exam_date, course:courses(title, title_ar)')
        .in('course_id', courseIds)
        .eq('status', 'published')
        .order('exam_date', { ascending: true, nullsFirst: false })
        .limit(5);

      if (!publishedExams) return;

      // Get attempted exam IDs
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('exam_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      const attemptedIds = new Set((attempts || []).map(a => a.exam_id));

      const upcoming = publishedExams
        .filter(e => !attemptedIds.has(e.id))
        .map(e => ({
          id: e.id,
          title: e.title,
          title_ar: e.title_ar,
          exam_date: e.exam_date,
          course_title: (e.course as any)?.title || '',
          course_title_ar: (e.course as any)?.title_ar || '',
        }));

      setExams(upcoming.slice(0, 3));
    };

    fetchExams();
  }, [user]);

  if (exams.length === 0) return null;

  const Chevron = isArabic ? ChevronLeft : ChevronRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {isArabic ? 'امتحانات قادمة' : 'Upcoming Exams'}
        </h3>
      </div>

      <div className="space-y-2">
        {exams.map(exam => (
          <Link
            key={exam.id}
            to={`/exams`}
            className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {isArabic ? exam.title_ar : exam.title}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {isArabic ? exam.course_title_ar : exam.course_title}
                {exam.exam_date && (
                  <> · {format(new Date(exam.exam_date), 'd MMM', { locale: isArabic ? ar : undefined })}</>
                )}
              </p>
            </div>
            <Chevron className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </motion.div>
  );
};
