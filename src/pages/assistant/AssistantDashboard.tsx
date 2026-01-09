import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, BookOpen, CreditCard, TrendingUp, Clock, CheckCircle, Award, ClipboardList, BarChart3, FileText, GraduationCap, Send, MapPin, Calendar, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { PlatformGuidance } from '@/components/guidance/PlatformGuidance';
import { ConversionInsightsCard } from '@/components/assistant/ConversionInsightsCard';

interface Stats {
  totalStudents: number;
  totalEnrollments: number;
  pendingEnrollments: number;
  activeEnrollments: number;
  totalLessons: number;
  totalExams: number;
  totalAttendance: number;
  avgExamScore: number;
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
  });
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !hasAccess) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setProfile(profileData);

        // Fetch all stats in parallel
        // Count only users with 'student' role
        const [
          { count: studentsCount },
          { data: enrollments },
          { count: lessonsCount },
          { count: examsCount },
          { count: attendanceCount },
          { data: examResults }
        ] = await Promise.all([
          supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('course_enrollments').select('status'),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('exams').select('*', { count: 'exact', head: true }),
          supabase.from('lesson_attendance').select('*', { count: 'exact', head: true }),
          supabase.from('exam_results').select('score, exams:exam_id(max_score)')
        ]);

        const totalEnrollments = enrollments?.length || 0;
        const pendingEnrollments = enrollments?.filter(e => e.status === 'pending').length || 0;
        const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;

        const avgExamScore = (examResults || []).length > 0
          ? Math.round((examResults || []).reduce((sum, r) => {
              const maxScore = (r.exams as any)?.max_score || 100;
              return sum + ((r.score / maxScore) * 100);
            }, 0) / examResults!.length)
          : 0;

        setStats({
          totalStudents: studentsCount || 0,
          totalEnrollments,
          pendingEnrollments,
          activeEnrollments,
          totalLessons: lessonsCount || 0,
          totalExams: examsCount || 0,
          totalAttendance: attendanceCount || 0,
          avgExamScore,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && !roleLoading && hasAccess) {
      fetchStats();
    }
  }, [user, authLoading, roleLoading, hasAccess]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Simplified stats - only essential metrics
  const statCards = [
    {
      title: t('assistant.totalStudents'),
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-primary/10 text-primary',
      link: '/assistant/students',
    },
    {
      title: t('assistant.totalLessons'),
      value: stats.totalLessons,
      icon: BookOpen,
      color: 'bg-blue-500/10 text-blue-600',
      link: '/assistant/lessons',
    },
    {
      title: t('assistant.activeEnrollments'),
      value: stats.activeEnrollments,
      icon: CheckCircle,
      color: 'bg-green-500/10 text-green-600',
      link: '/assistant/enrollments',
    },
    {
      title: t('assistant.avgExamScore'),
      value: `${stats.avgExamScore}%`,
      icon: Award,
      color: 'bg-purple-500/10 text-purple-600',
      link: '/assistant/reports',
    },
  ];

  // Robust name handling with Arabic fallback
  const fullName = profile?.full_name?.trim() || '';
  const firstName = fullName.split(' ')[0] || user?.email?.split('@')[0] || '';
  const hasValidName = firstName && firstName.length > 0;

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {hasValidName 
                  ? `${t('dashboard.welcomeMessage')} ${firstName}! 👋`
                  : `${t('dashboard.welcomeMessage')}! 👋`}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('assistant.platformSubtitle')}
              </p>
            </div>
            <PlatformGuidance role="assistant_teacher" isArabic={isRTL} />
          </div>
        </div>

        {/* Stats Grid - Simplified */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/50"
            >
              <div className="flex flex-col">
                <div className={`p-2 rounded-lg ${stat.color} w-fit mb-2`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '...' : stat.value}
                </p>
                <p className="text-muted-foreground text-xs mt-1">{stat.title}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions - ONLY Daily Frequent Actions */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {t('assistant.quickActions')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button asChild className="h-auto py-4 flex-col gap-2">
              <Link to="/assistant/students">
                <Users className="h-6 w-6" />
                <span>{t('assistant.students')}</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2 border-2 border-primary/30 bg-primary/5">
              <Link to="/assistant/courses">
                <GraduationCap className="h-6 w-6" />
                <span>{t('assistant.courses')}</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link to="/assistant/lessons">
                <BookOpen className="h-6 w-6" />
                <span>{t('assistant.lessons')}</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2 border-2 border-green-500/30 bg-green-500/5">
              <Link to="/assistant/lessons?action=add">
                <Plus className="h-6 w-6 text-green-600" />
                <span className="text-green-700">{t('assistant.addLesson')}</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2 border-2 border-blue-500/30 bg-blue-500/5">
              <Link to="/assistant/notifications">
                <Send className="h-6 w-6 text-blue-600" />
                <span className="text-blue-700">{t('assistant.sendNotifications')}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Advanced Actions - Collapsible */}
        <div className="bg-card border border-border rounded-xl p-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-lg font-semibold text-foreground mb-4"
          >
            <span>{t('assistant.advancedActions')}</span>
            {showAdvanced ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          
          {showAdvanced && (
            <div className="space-y-6">
              {/* Content Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t('assistant.content')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/courses">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      {t('assistant.courses')}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/chapters">
                      <FileText className="h-4 w-4 mr-2" />
                      {t('assistant.chapters')}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/lessons">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {t('assistant.lessons')}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/exams">
                      <Award className="h-4 w-4 mr-2" />
                      {t('assistant.exams')}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Students Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('assistant.students')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/students">
                      <Users className="h-4 w-4 mr-2" />
                      {t('assistant.studentList')}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/enrollments">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t('assistant.enrollments')}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Conversion Insights - Read-only */}
              <div className="mb-6">
                <ConversionInsightsCard />
              </div>

              {/* Analytics Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t('assistant.analytics')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/reports">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t('assistant.reports')}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Center Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('assistant.center')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/center-groups">
                      <MapPin className="h-4 w-4 mr-2" />
                      {t('assistant.groups')}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/center-sessions">
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('assistant.sessions')}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="justify-start h-10">
                    <Link to="/assistant/attendance">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      {t('assistant.attendance')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
