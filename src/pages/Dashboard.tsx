import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Play,
  Award,
  FileText,
  Settings,
  Bell,
  User,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Clock,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusSummaryCard } from '@/components/dashboard/StatusSummaryCard';
import { QuickActionsStrip, QuickAction } from '@/components/dashboard/QuickActionsStrip';
import { SmartContextCard } from '@/components/dashboard/SmartContextCard';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { InfoCard } from '@/components/dashboard/InfoCard';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { CourseProgressCard } from '@/components/dashboard/CourseProgressCard';
import { OverallProgressCard } from '@/components/dashboard/OverallProgressCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { StudentFocusStats } from '@/components/dashboard/StudentFocusStats';
import { ExamHistorySection } from '@/components/dashboard/ExamHistorySection';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { GRADE_LABELS, TRACK_LABELS } from '@/lib/gradeLabels';
import { StudentChatButton } from '@/components/messaging/StudentChatButton';
import { WelcomeOnboarding } from '@/components/onboarding/WelcomeOnboarding';
import { PlatformGuidance } from '@/components/guidance/PlatformGuidance';
import { useAvailableExamsCount } from '@/hooks/useAvailableExamsCount';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';

// Helper to get full group label
const getGroupLabel = (academicYear: string | null, languageTrack: string | null, isArabic: boolean): string | null => {
  if (!academicYear || !languageTrack) return null;
  const year = GRADE_LABELS[academicYear];
  const track = TRACK_LABELS[languageTrack];
  if (!year || !track) return null;
  return isArabic ? `${year.ar} - ${track.ar}` : `${year.en} - ${track.en}`;
};

interface Profile {
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  academic_year: string | null;
  language_track: string | null;
  avatar_url: string | null;
  attendance_mode: 'online' | 'center' | 'hybrid' | null;
  center_group_name?: string | null;
}

interface EnrolledCourse {
  id: string;
  course_id: string;
  progress: number;
  completed_lessons: number;
  course: {
    id: string;
    title: string;
    title_ar: string;
    lessons_count: number;
    duration_hours: number;
  };
}

interface ExamResult {
  id: string;
  score: number;
  created_at: string;
  exam: {
    id: string;
    title: string;
    title_ar: string;
    max_score: number;
    pass_mark: number;
    course: {
      title: string;
      title_ar: string;
    };
  };
}

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [focusStats, setFocusStats] = useState<{
    totalSessions: number;
    totalActiveMinutes: number;
    totalPausedMinutes: number;
    completedSegments: number;
    totalInterruptions: number;
    uniqueLessonsWatched: number;
    avgSessionMinutes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  
  // Get badge counts - MUST be before any early returns (React hooks rules)
  const { count: availableExamsCount } = useAvailableExamsCount();
  const { count: unreadMessagesCount } = useUnreadMessagesCount();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, grade, academic_year, language_track, avatar_url, attendance_mode')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      // Fetch center group name if center student
      let centerGroupName: string | null = null;
      if (profileData?.attendance_mode === 'center') {
        const { data: membership } = await supabase
          .from('center_group_members')
          .select('center_groups!inner(name)')
          .eq('student_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (membership) {
          const groupData = membership.center_groups as unknown as { name: string } | null;
          centerGroupName = groupData?.name || null;
        }
      }
      
      setProfile(profileData ? { ...profileData, center_group_name: centerGroupName } : null);

      // Fetch enrolled courses with course details
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          progress,
          completed_lessons,
          course:courses (
            id,
            title,
            title_ar,
            lessons_count,
            duration_hours
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (enrollmentsError) throw enrollmentsError;
      setEnrolledCourses((enrollmentsData || []) as unknown as EnrolledCourse[]);

      // Fetch exam results for this user with more details
      const { data: examResultsData, error: examResultsError } = await supabase
        .from('exam_results')
        .select(`
          id,
          score,
          created_at,
          exam:exams (
            id,
            title,
            title_ar,
            max_score,
            pass_mark,
            course:courses (
              title,
              title_ar
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (examResultsError) throw examResultsError;
      setExamResults((examResultsData || []) as unknown as ExamResult[]);

      // Fetch focus sessions for this student
      const { data: focusData } = await supabase.from('focus_sessions').select('*').eq('user_id', user.id);

      if (focusData && focusData.length > 0) {
        const totalActive = focusData.reduce((sum, s) => sum + (s.total_active_seconds || 0), 0);
        const totalPaused = focusData.reduce((sum, s) => sum + (s.total_paused_seconds || 0), 0);
        const totalSegments = focusData.reduce((sum, s) => sum + (s.completed_segments || 0), 0);
        const totalInterruptions = focusData.reduce((sum, s) => sum + (s.interruptions || 0), 0);
        const uniqueLessons = new Set(focusData.map((s) => s.lesson_id)).size;

        setFocusStats({
          totalSessions: focusData.length,
          totalActiveMinutes: Math.round(totalActive / 60),
          totalPausedMinutes: Math.round(totalPaused / 60),
          completedSegments: totalSegments,
          totalInterruptions,
          uniqueLessonsWatched: uniqueLessons,
          avgSessionMinutes: focusData.length > 0 ? Math.round(totalActive / 60 / focusData.length) : 0,
        });
      }

      // Find the next lesson to continue (first incomplete lesson in current course)
      if (enrollmentsData && enrollmentsData.length > 0) {
        const firstCourse = enrollmentsData[0];
        const courseId = firstCourse.course_id;
        
        // Get completed lessons for this course
        const { data: completedLessons } = await supabase
          .from('lesson_completions')
          .select('lesson_id')
          .eq('user_id', user.id);
        
        const completedLessonIds = new Set((completedLessons || []).map(l => l.lesson_id));
        
        // Get all lessons for this course ordered by order_index
        const { data: courseLessons } = await supabase
          .from('lessons')
          .select('id, order_index')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
        
        if (courseLessons && courseLessons.length > 0) {
          // Find the first incomplete lesson
          const nextLesson = courseLessons.find(l => !completedLessonIds.has(l.id));
          if (nextLesson) {
            setNextLessonId(nextLesson.id);
          } else {
            // All lessons completed, go to first lesson
            setNextLessonId(courseLessons[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Robust name handling with Arabic fallback
  const fullName = profile?.full_name?.trim() || '';
  const firstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || '';
  const hasValidName = firstName && firstName.length > 0;
  const groupLabel = getGroupLabel(profile?.academic_year || null, profile?.language_track || null, isArabic);

  // Calculate stats
  const totalLessonsCompleted = enrolledCourses.reduce((sum, e) => sum + (e.completed_lessons || 0), 0);
  const totalLessons = enrolledCourses.reduce((sum, e) => sum + (e.course?.lessons_count || 0), 0);
  const lessonsRemaining = totalLessons - totalLessonsCompleted;
  const overallProgress = totalLessons > 0 ? Math.round((totalLessonsCompleted / totalLessons) * 100) : 0;
  const examsTaken = examResults.length;

  // Get current/active course for status card
  const currentCourse = enrolledCourses[0];
  const currentCourseTitle = currentCourse
    ? (isArabic ? currentCourse.course?.title_ar : currentCourse.course?.title)
    : null;
  const currentCourseProgress = currentCourse?.progress || 0;

  // Determine smart card type based on user state
  const getSmartCardType = (): 'new_user' | 'resume' | 'inactive' | 'progress' => {
    if (enrolledCourses.length === 0) {
      return 'new_user';
    }
    if (totalLessonsCompleted > 0 && currentCourse) {
      return 'resume';
    }
    return 'progress';
  };

  // Quick actions for student - Ana Vodafone style (max 5 items)

  // Quick actions for student - Ana Vodafone style (max 5 items)
  // Removed duplicate "My Courses" since it's shown in section below
  const quickActions: QuickAction[] = [
    {
      icon: Sparkles,
      label: isArabic ? 'حصص مجانية' : 'Free Lessons',
      href: '/free-lessons',
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Award,
      label: isArabic ? 'الامتحانات' : 'Exams',
      href: '/exams',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      badge: availableExamsCount > 0 ? (availableExamsCount > 9 ? '9+' : String(availableExamsCount)) : undefined,
    },
    {
      icon: MessageCircle,
      label: isArabic ? 'الرسائل' : 'Messages',
      href: '/messages',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      badge: unreadMessagesCount > 0 ? (unreadMessagesCount > 9 ? '9+' : String(unreadMessagesCount)) : undefined,
    },
    {
      icon: User,
      label: isArabic ? 'الحساب' : 'Account',
      href: '/settings',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div
      className="min-h-screen bg-muted/20 pb-mobile-nav overflow-x-hidden"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <Navbar />

      <>
        <main className="pt-20 sm:pt-24 pb-8 overflow-x-hidden content-appear">
          {/* Desktop max-width container for professional containment */}
          <div className="container mx-auto px-3 sm:px-4 max-w-4xl xl:max-w-5xl">
          {/* Hero Header - Vodafone-inspired personalized greeting */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-4 sm:p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  {isArabic ? 'جاهز تكمل مذاكرة النهارده؟' : 'Ready to continue today?'}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {hasValidName
                    ? `${isArabic ? 'أهلاً' : 'Hey'} ${firstName}! 👋`
                    : `${isArabic ? 'أهلاً بيك' : 'Welcome'}! 👋`}
                </h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Study Mode Badge - READ ONLY (hybrid normalized to online) */}
                  {profile?.attendance_mode && (
                    <Badge 
                      variant={profile.attendance_mode === 'center' ? 'default' : 'secondary'}
                      className={cn(
                        "text-[10px] px-2 py-0.5",
                        profile.attendance_mode === 'center' 
                          ? "bg-green-600/90 hover:bg-green-600/90 text-white" 
                          : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/10"
                      )}
                    >
                      {profile.attendance_mode === 'center'
                        ? (isArabic 
                            ? `سنتر${profile.center_group_name ? ` - ${profile.center_group_name}` : ''}` 
                            : `Center${profile.center_group_name ? ` - ${profile.center_group_name}` : ''}`)
                        : (isArabic ? 'أونلاين' : 'Online') // hybrid also shows as Online
                      }
                    </Badge>
                  )}
                  {/* Academic Group Badge */}
                  {groupLabel && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {groupLabel}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PlatformGuidance role="student" isArabic={isArabic} />
                <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                  <Link to="/settings">
                    <Settings className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Progress summary in hero */}
            {enrolledCourses.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {isArabic ? 'التقدم الكلي' : 'Overall Progress'}
                  </span>
                  <span className="font-bold text-foreground">{overallProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                {currentCourse && (
                  <Button 
                    asChild 
                    className="w-full mt-4 gap-2"
                  >
                    <Link to={nextLessonId ? `/lesson/${nextLessonId}` : `/course/${currentCourse.course_id}`}>
                      <Play className="w-4 h-4" />
                      {isArabic ? 'استكمل الحصة' : 'Continue Lesson'}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Strip - Ana Vodafone Grid */}
          <QuickActionsStrip actions={quickActions} isRTL={isArabic} className="mb-5" />

          {/* Smart Context Card - "Made for YOU" */}
          <SmartContextCard
            type={getSmartCardType()}
            isRTL={isArabic}
            courseName={currentCourseTitle || undefined}
            courseId={currentCourse?.course_id}
            lessonsCompleted={currentCourse?.completed_lessons || 0}
            totalLessons={currentCourse?.course?.lessons_count || 0}
            className="mb-5"
          />

          {/* Contact Assistant Button */}
          <div className="mb-6">
            <StudentChatButton isRTL={isArabic} className="w-full justify-center" />
          </div>

          {/* Stats Cards - Vodafone Style */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <InfoCard
              icon={CheckCircle2}
              value={totalLessonsCompleted}
              label={isArabic ? 'حصة مكتملة' : 'Lessons Done'}
              subtext={totalLessons > 0 ? (isArabic ? `من ${totalLessons} حصة` : `of ${totalLessons} total`) : undefined}
              variant="success"
              compact
            />
            <InfoCard
              icon={Clock}
              value={lessonsRemaining}
              label={isArabic ? 'حصة متبقية' : 'Remaining'}
              variant="muted"
              compact
            />
            <InfoCard
              icon={Award}
              value={examsTaken}
              label={isArabic ? 'امتحان تم' : 'Exams Taken'}
              variant="primary"
              compact
            />
            <InfoCard
              icon={TrendingUp}
              value={`${overallProgress}%`}
              label={isArabic ? 'التقدم الكلي' : 'Overall'}
              variant="warning"
              compact
            />
          </div>

          {/* My Courses Section */}
          <SectionCard
            title={isArabic ? 'كورساتي' : 'My Courses'}
            icon={BookOpen}
            seeAllHref="/courses"
            isRTL={isArabic}
            className="mb-5"
          >
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  {isArabic ? 'مفيش كورسات مشترك فيها' : 'No courses enrolled yet'}
                </p>
                <Button size="sm" asChild>
                  <Link to="/courses">{isArabic ? 'تصفح الكورسات' : 'Browse Courses'}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledCourses.slice(0, 3).map((enrollment) => {
                  const course = enrollment.course;
                  if (!course) return null;
                  return (
                    <CourseProgressCard
                      key={enrollment.id}
                      title={isArabic ? course.title_ar : course.title}
                      completedLessons={enrollment.completed_lessons || 0}
                      totalLessons={course.lessons_count || 0}
                      isRTL={isArabic}
                      onContinue={() => navigate(`/course/${course.id}`)}
                    />
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Exam History Section - NEW */}
          <div className="mb-5">
            <ExamHistorySection 
              examResults={examResults}
              isArabic={isArabic}
            />
          </div>

          {/* Performance Section - Mobile */}
          <div className="md:hidden mb-5">
            <PerformanceChart
              examScores={examResults.map((r) => ({
                score: r.score,
                maxScore: r.exam?.max_score || 100,
                title: isArabic ? r.exam?.title_ar : r.exam?.title,
              }))}
              lessonsCompleted={totalLessonsCompleted}
              totalLessons={totalLessons}
              compact
            />
          </div>

          {/* Performance Section - Desktop/Tablet */}
          <div className="hidden md:grid md:grid-cols-2 gap-5 mb-5">
            {/* Overall Progress with Ring */}
            <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-5">
              <ProgressRing 
                progress={overallProgress} 
                size={90} 
                label={isArabic ? 'مكتمل' : 'Complete'}
              />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {isArabic ? 'التقدم الإجمالي' : 'Overall Progress'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {overallProgress >= 75
                    ? (isArabic ? 'أداء ممتاز! استمر 🔥' : 'Excellent! Keep going 🔥')
                    : overallProgress >= 50
                    ? (isArabic ? 'في الطريق الصح 👏' : 'On the right track 👏')
                    : (isArabic ? 'ابدأ رحلتك 🚀' : 'Start your journey 🚀')}
                </p>
              </div>
            </div>

            {/* Performance Chart */}
            <PerformanceChart
              examScores={examResults.map((r) => ({
                score: r.score,
                maxScore: r.exam?.max_score || 100,
                title: isArabic ? r.exam?.title_ar : r.exam?.title,
              }))}
              lessonsCompleted={totalLessonsCompleted}
              totalLessons={totalLessons}
            />
          </div>

          {/* Focus Stats - if available */}
          {focusStats && (
            <div className="mb-5">
              <StudentFocusStats stats={focusStats} totalLessonsEnrolled={totalLessons} isArabic={isArabic} />
            </div>
          )}


          {/* Account Card - Mobile optimized */}
          <SectionCard
            title={isArabic ? 'حسابي' : 'My Account'}
            icon={User}
            isRTL={isArabic}
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-lg">{firstName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{fullName || user?.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Link to="/settings">
                {isArabic ? (
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </Link>
            </div>

            {profile?.phone && (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground mb-0.5">{isArabic ? 'رقم الواتساب' : 'WhatsApp'}</p>
                <p className="font-medium text-foreground text-sm" dir="ltr">{profile.phone}</p>
              </div>
            )}
          </SectionCard>
        </div>
        </main>
      </>
      <Footer />
      
      {/* First-time user welcome onboarding */}
      <WelcomeOnboarding />
    </div>
  );
};

export default Dashboard;
