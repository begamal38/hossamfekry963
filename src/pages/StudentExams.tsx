import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ArrowRight,
  BookOpen,
  Target,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamWithDetails {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
  chapter_id: string | null;
  status: 'draft' | 'published' | 'closed' | 'archived';
  time_limit_minutes: number | null;
  pass_mark: number;
  max_score: number;
  max_attempts: number | null;
  course: {
    title: string;
    title_ar: string;
  };
  chapter?: {
    title: string;
    title_ar: string;
  } | null;
  attempts: {
    id: string;
    score: number;
    is_completed: boolean;
    completed_at: string | null;
  }[];
}

const StudentExams: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  
  const [exams, setExams] = useState<ExamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('all');

  const fetchExams = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (!enrollments?.length) {
        setExams([]);
        return;
      }
      
      const courseIds = enrollments.map(e => e.course_id);
      
      // Get published exams for enrolled courses
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          title_ar,
          course_id,
          chapter_id,
          status,
          time_limit_minutes,
          pass_mark,
          max_score,
          max_attempts
        `)
        .eq('status', 'published')
        .in('course_id', courseIds);
      
      if (examError) throw examError;
      if (!examData?.length) {
        setExams([]);
        return;
      }
      
      // Get courses and chapters
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, title_ar')
        .in('id', courseIds);
      
      const chapterIds = examData
        .filter(e => e.chapter_id)
        .map(e => e.chapter_id as string);
      
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, title, title_ar')
        .in('id', chapterIds.length ? chapterIds : ['']);
      
      // Get user's attempts
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('id, exam_id, score, is_completed, completed_at')
        .eq('user_id', user.id)
        .in('exam_id', examData.map(e => e.id));
      
      // Combine data
      const examsWithDetails: ExamWithDetails[] = examData.map(exam => ({
        ...exam,
        course: courses?.find(c => c.id === exam.course_id) || { title: '', title_ar: '' },
        chapter: exam.chapter_id 
          ? chapters?.find(c => c.id === exam.chapter_id) || null 
          : null,
        attempts: attempts?.filter(a => a.exam_id === exam.id) || []
      }));
      
      setExams(examsWithDetails);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchExams();
  }, [fetchExams]);

  const getExamStatus = (exam: ExamWithDetails) => {
    const completedAttempts = exam.attempts.filter(a => a.is_completed);
    const lastAttempt = completedAttempts.sort((a, b) => 
      new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
    )[0];
    
    if (!completedAttempts.length) {
      return { 
        status: 'available', 
        label: isArabic ? 'متاح' : 'Available',
        color: 'bg-green-500/10 text-green-600'
      };
    }
    
    const passed = lastAttempt && lastAttempt.score >= exam.pass_mark;
    const canRetake = exam.max_attempts === null || completedAttempts.length < exam.max_attempts;
    
    if (passed) {
      return { 
        status: 'passed', 
        label: isArabic ? 'ناجح' : 'Passed',
        color: 'bg-green-500/10 text-green-600',
        score: lastAttempt.score
      };
    }
    
    if (canRetake) {
      return { 
        status: 'retry', 
        label: isArabic ? 'أعد المحاولة' : 'Retry',
        color: 'bg-amber-500/10 text-amber-600',
        score: lastAttempt?.score
      };
    }
    
    return { 
      status: 'failed', 
      label: isArabic ? 'لم تنجح' : 'Failed',
      color: 'bg-red-500/10 text-red-600',
      score: lastAttempt?.score
    };
  };

  const filteredExams = exams.filter(exam => {
    if (filter === 'all') return true;
    const status = getExamStatus(exam);
    if (filter === 'available') return status.status === 'available' || status.status === 'retry';
    if (filter === 'completed') return status.status === 'passed' || status.status === 'failed';
    return true;
  });

  const handleStartExam = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-8">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/platform')}
              className="shrink-0"
            >
              <BackIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {isArabic ? 'الامتحانات' : 'My Exams'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'اختبر نفسك وتابع تقدمك' : 'Test yourself and track progress'}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { key: 'all', label: isArabic ? 'الكل' : 'All' },
              { key: 'available', label: isArabic ? 'متاحة' : 'Available' },
              { key: 'completed', label: isArabic ? 'مكتملة' : 'Completed' }
            ].map(tab => (
              <Button
                key={tab.key}
                variant={filter === tab.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(tab.key as typeof filter)}
                className="shrink-0"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-24 mt-2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredExams.length === 0 ? (
            /* Empty State - Calm, reassuring design */
            <Card className="border-dashed border-2 bg-card/50">
              <div className="py-12 text-center">
                {/* Icon container */}
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-muted">
                  <Award className="w-8 h-8 text-muted-foreground" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {filter === 'all' 
                    ? (isArabic ? 'لا يوجد امتحانات متاحة حاليًا' : 'No exams available right now')
                    : filter === 'available'
                      ? (isArabic ? 'لا توجد امتحانات متاحة' : 'No available exams')
                      : (isArabic ? 'لم تكمل أي امتحان بعد' : 'No completed exams yet')
                  }
                </h3>

                {/* Subtitle with notification promise */}
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  {filter === 'all' 
                    ? (isArabic 
                        ? 'سيتم إشعارك فور نشر أي امتحان جديد' 
                        : 'You\'ll be notified when new exams are published')
                    : (isArabic 
                        ? 'اشترك في الكورسات لتظهر لك الامتحانات' 
                        : 'Enroll in courses to see exams here')
                  }
                </p>

                {/* CTA only if no enrollments */}
                {filter !== 'completed' && (
                  <Button onClick={() => navigate('/courses')} variant="outline">
                    <BookOpen className="w-4 h-4 me-2" />
                    {isArabic ? 'تصفح الكورسات' : 'Browse Courses'}
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            /* Exams List */
            <div className="space-y-3">
              {filteredExams.map(exam => {
                const examStatus = getExamStatus(exam);
                const completedAttempts = exam.attempts.filter(a => a.is_completed).length;
                
                return (
                  <Card 
                    key={exam.id} 
                    className="p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        examStatus.status === 'passed' ? 'bg-green-500/10' :
                        examStatus.status === 'failed' ? 'bg-red-500/10' :
                        'bg-purple-500/10'
                      )}>
                        {examStatus.status === 'passed' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : examStatus.status === 'failed' ? (
                          <XCircle className="w-6 h-6 text-red-600" />
                        ) : (
                          <Target className="w-6 h-6 text-purple-600" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground line-clamp-1">
                            {isArabic ? exam.title_ar : exam.title}
                          </h3>
                          <Badge className={cn("shrink-0 text-xs", examStatus.color)}>
                            {examStatus.label}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {isArabic ? exam.course.title_ar : exam.course.title}
                          {exam.chapter && ` • ${isArabic ? exam.chapter.title_ar : exam.chapter.title}`}
                        </p>
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                          {exam.time_limit_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {exam.time_limit_minutes} {isArabic ? 'دقيقة' : 'min'}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Target className="w-3.5 h-3.5" />
                            {isArabic ? 'الحد الأدنى:' : 'Pass:'} {exam.pass_mark}/{exam.max_score}
                          </span>
                          {examStatus.score !== undefined && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Award className="w-3.5 h-3.5" />
                              {isArabic ? 'درجتك:' : 'Score:'} {examStatus.score}/{exam.max_score}
                            </span>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        {(examStatus.status === 'available' || examStatus.status === 'retry') && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStartExam(exam.id)}
                            className="gap-2"
                          >
                            {examStatus.status === 'retry' ? (
                              <>
                                <RotateCcw className="w-4 h-4" />
                                {isArabic ? 'أعد الامتحان' : 'Retake Exam'}
                              </>
                            ) : (
                              <>
                                <Award className="w-4 h-4" />
                                {isArabic ? 'ابدأ الامتحان' : 'Start Exam'}
                              </>
                            )}
                          </Button>
                        )}
                        
                        {examStatus.status === 'passed' && (
                          <p className="text-sm text-green-600 font-medium">
                            {isArabic ? '🎉 أحسنت! اجتزت هذا الامتحان' : '🎉 Great job! You passed this exam'}
                          </p>
                        )}
                        
                        {completedAttempts > 0 && exam.max_attempts && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {isArabic 
                              ? `المحاولات: ${completedAttempts}/${exam.max_attempts}`
                              : `Attempts: ${completedAttempts}/${exam.max_attempts}`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StudentExams;
