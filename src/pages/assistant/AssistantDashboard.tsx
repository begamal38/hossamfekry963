import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Plus, 
  TrendingUp, 
  CheckCircle, 
  Award, 
  FileText, 
  GraduationCap, 
  Send, 
  BarChart3,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Bell,
  Settings,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { QuickActionsStrip, QuickAction } from '@/components/dashboard/QuickActionsStrip';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { InfoCard } from '@/components/dashboard/InfoCard';
import { ConversionInsightsCard } from '@/components/assistant/ConversionInsightsCard';
import { PlatformGuidance } from '@/components/guidance/PlatformGuidance';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { SystemStatusTooltip } from '@/components/assistant/SystemStatusTooltip';
import { SystemStatusIndicator } from '@/components/assistant/SystemStatusIndicator';

interface Stats {
  totalStudents: number;
  totalEnrollments: number;
  pendingEnrollments: number;
  activeEnrollments: number;
  totalLessons: number;
  totalExams: number;
  totalAttendance: number;
  avgExamScore: number;
  newStudentsThisWeek: number;
}

interface Profile {
  full_name: string | null;
}

export default function AssistantDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalEnrollments: 0,
    pendingEnrollments: 0,
    activeEnrollments: 0,
    totalLessons: 0,
    totalExams: 0,
    totalAttendance: 0,
    avgExamScore: 0,
    newStudentsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { count: unreadMessages } = useUnreadMessagesCount();
  const systemStatus = useSystemStatus();

  const hasAccess = canAccessDashboard();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!authLoading && !roleLoading && user && !hasAccess) {
      navigate('/');
    }
  }, [user, authLoading, roleLoading, hasAccess, navigate]);

  const fetchStats = useCallback(async () => {
    if (!user || !hasAccess) return;

    try {
      setLoading(true);
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setProfile(profileData);

      // Fetch all stats in parallel
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [
        { count: studentsCount },
        { data: enrollments },
        { count: lessonsCount },
        { count: examsCount },
        { count: attendanceCount },
        { data: examResults },
        { count: newStudentsCount },
        { data: conversations }
      ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('course_enrollments').select('status'),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('exams').select('*', { count: 'exact', head: true }),
        supabase.from('lesson_attendance').select('*', { count: 'exact', head: true }),
        supabase.from('exam_attempts').select('score, total_questions, exams:exam_id(max_score)').eq('is_completed', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('conversations').select('unread_count_assistant').eq('assistant_teacher_id', user.id)
      ]);

      const totalEnrollments = enrollments?.length || 0;
      const pendingEnrollments = enrollments?.filter(e => e.status === 'pending').length || 0;
      const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;

      const avgExamScore = (examResults || []).length > 0
        ? Math.round((examResults || []).reduce((sum, r) => {
            const maxScore = (r.exams as any)?.max_score || 100;
            const percentageScore = (r.score / r.total_questions) * maxScore;
            return sum + ((percentageScore / maxScore) * 100);
          }, 0) / examResults!.length)
        : 0;

      // Unread messages now handled by useUnreadMessagesCount hook

      setStats({
        totalStudents: studentsCount || 0,
        totalEnrollments,
        pendingEnrollments,
        activeEnrollments,
        totalLessons: lessonsCount || 0,
        totalExams: examsCount || 0,
        totalAttendance: attendanceCount || 0,
        avgExamScore,
        newStudentsThisWeek: newStudentsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, hasAccess]);

  useEffect(() => {
    if (!authLoading && !roleLoading && hasAccess) {
      fetchStats();

      // Subscribe to realtime changes for stats
      const channel = supabase
        .channel('assistant-dashboard-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'course_enrollments' },
          () => fetchStats()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_roles' },
          () => fetchStats()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => fetchStats()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'exam_attempts' },
          () => fetchStats()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, roleLoading, hasAccess, fetchStats]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  if (authLoading || roleLoading) {
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

  // Quick actions for assistant
  const quickActions: QuickAction[] = [
    {
      icon: Award,
      label: 'Top Students',
      href: '/assistant/top-students',
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Users,
      label: isRTL ? 'الطلاب' : 'Students',
      href: '/assistant/students',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: GraduationCap,
      label: isRTL ? 'الكورسات' : 'Courses',
      href: '/assistant/courses',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: MessageCircle,
      label: isRTL ? 'الرسائل' : 'Messages',
      href: '/assistant/messages',
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      badge: unreadMessages > 0 ? (unreadMessages > 9 ? '9+' : String(unreadMessages)) : undefined,
    },
    {
      icon: Send,
      label: isRTL ? 'إشعار' : 'Notify',
      href: '/assistant/notifications',
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: CreditCard,
      label: isRTL ? 'الاشتراكات' : 'Enrollments',
      href: '/assistant/enrollments',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: BarChart3,
      label: isRTL ? 'التقارير' : 'Reports',
      href: '/assistant/reports',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <PullToRefresh onRefresh={handleRefresh} className="h-[calc(100vh-4rem)] md:h-auto md:overflow-visible">
        <main className="pt-20 sm:pt-24 pb-8">
          <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          {/* Welcome Header - Compact */}
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                {hasValidName 
                  ? `${isRTL ? 'أهلاً' : 'Hey'} ${firstName}! 👋`
                  : `${isRTL ? 'أهلاً بيك' : 'Welcome'}! 👋`}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {t('assistant.platformSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <PlatformGuidance role="assistant_teacher" isArabic={isRTL} />
              <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                <Link to="/assistant/notifications">
                  <Bell className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                <Link to="/settings">
                  <Settings className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* System Status Indicator - Visual State Signal */}
          <SystemStatusTooltip status={systemStatus} isRTL={isRTL}>
            <div>
              <SystemStatusIndicator
                status={systemStatus}
                studentCount={stats.totalStudents}
                isRTL={isRTL}
                href="/assistant/students"
                loading={loading}
                className="mb-5"
              />
            </div>
          </SystemStatusTooltip>

          {/* Quick Actions Strip */}
          <QuickActionsStrip actions={quickActions} isRTL={isRTL} className="mb-6" />

          {/* Stats Cards - Vodafone Style */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <InfoCard
              icon={Users}
              value={loading ? '...' : stats.totalStudents}
              label={isRTL ? 'طالب مسجل' : 'Students'}
              subtext={stats.newStudentsThisWeek > 0 
                ? (isRTL ? `+${stats.newStudentsThisWeek} جديد` : `+${stats.newStudentsThisWeek} new`)
                : undefined
              }
              href="/assistant/students"
              color="text-primary"
              bgColor="bg-primary/10"
              isRTL={isRTL}
              compact
            />
            <InfoCard
              icon={BookOpen}
              value={loading ? '...' : stats.totalLessons}
              label={isRTL ? 'حصة' : 'Lessons'}
              href="/assistant/lessons"
              color="text-blue-600"
              bgColor="bg-blue-500/10"
              isRTL={isRTL}
              compact
            />
            <InfoCard
              icon={CheckCircle}
              value={loading ? '...' : stats.activeEnrollments}
              label={isRTL ? 'اشتراك نشط' : 'Active'}
              href="/assistant/enrollments"
              color="text-green-600"
              bgColor="bg-green-500/10"
              isRTL={isRTL}
              compact
            />
            <InfoCard
              icon={Award}
              value={loading ? '...' : `${stats.avgExamScore}%`}
              label={isRTL ? 'متوسط الامتحانات' : 'Avg Score'}
              href="/assistant/reports"
              color="text-purple-600"
              bgColor="bg-purple-500/10"
              isRTL={isRTL}
              compact
            />
          </div>

          {/* Conversion Insights */}
          <div className="mb-5">
            <ConversionInsightsCard />
          </div>

          {/* Content Management Section */}
          <SectionCard
            title={isRTL ? 'إدارة المحتوى' : 'Content Management'}
            icon={BookOpen}
            isRTL={isRTL}
            className="mb-5"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                to="/assistant/courses"
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <GraduationCap className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium text-foreground">{t('assistant.courses')}</span>
              </Link>
              <Link
                to="/assistant/chapters"
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-medium text-foreground">{t('assistant.chapters')}</span>
              </Link>
              <Link
                to="/assistant/lessons"
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <BookOpen className="w-6 h-6 text-green-600" />
                <span className="text-xs font-medium text-foreground">{t('assistant.lessons')}</span>
              </Link>
              <Link
                to="/assistant/exams"
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <Award className="w-6 h-6 text-purple-600" />
                <span className="text-xs font-medium text-foreground">{t('assistant.exams')}</span>
              </Link>
            </div>
          </SectionCard>

          {/* Advanced Actions - Collapsible */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-base font-semibold text-foreground"
            >
              <span>{isRTL ? 'إجراءات متقدمة' : 'Advanced Actions'}</span>
              {showAdvanced ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* Students Section */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    {t('assistant.students')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" size="sm" asChild className="justify-start h-9 text-xs">
                      <Link to="/assistant/students">
                        <Users className="h-3.5 w-3.5 mr-2" />
                        {t('assistant.studentList')}
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="justify-start h-9 text-xs">
                      <Link to="/assistant/enrollments">
                        <CreditCard className="h-3.5 w-3.5 mr-2" />
                        {t('assistant.enrollments')}
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Analytics Section */}
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5" />
                    {t('assistant.analytics')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" size="sm" asChild className="justify-start h-9 text-xs">
                      <Link to="/assistant/reports">
                        <BarChart3 className="h-3.5 w-3.5 mr-2" />
                        {t('assistant.reports')}
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild className="justify-start h-9 text-xs">
                      <Link to="/assistant/exams">
                        <TrendingUp className="h-3.5 w-3.5 mr-2" />
                        {t('exam.results')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </main>
      </PullToRefresh>
    </div>
  );
}
