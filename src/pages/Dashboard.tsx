import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileCheck, 
  Clock, 
  TrendingUp, 
  Play,
  ChevronRight,
  Calendar,
  Award,
  Target,
  Settings
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const GRADE_OPTIONS: Record<string, { ar: string; en: string }> = {
  'second_arabic': { ar: 'ثانية ثانوي عربي', en: '2nd Year - Arabic' },
  'second_languages': { ar: 'ثانية ثانوي لغات', en: '2nd Year - Languages' },
  'third_arabic': { ar: 'ثالثة ثانوي عربي', en: '3rd Year - Arabic' },
  'third_languages': { ar: 'ثالثة ثانوي لغات', en: '3rd Year - Languages' },
};

interface Profile {
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  avatar_url: string | null;
}

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, grade, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const studentName = profile?.full_name || user?.email?.split('@')[0] || 'طالب';
  const gradeInfo = profile?.grade ? GRADE_OPTIONS[profile.grade] : null;

  // Placeholder stats - to be replaced with real data later
  const stats = {
    lessonsCompleted: 0,
    lessonsRemaining: 0,
    examsTaken: 0,
    examsPending: 0,
    averageScore: 0,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {t('dashboard.welcome')}, {studentName}! 👋
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-muted-foreground">
                    {isArabic ? 'استمر في رحلة تعلمك' : 'Continue your learning journey'}
                  </p>
                  {gradeInfo && (
                    <Badge variant="secondary" className="text-sm">
                      {isArabic ? gradeInfo.ar : gradeInfo.en}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/settings">
                  <Settings className="w-4 h-4" />
                  {isArabic ? 'إعدادات الحساب' : 'Account Settings'}
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { icon: BookOpen, value: stats.lessonsCompleted, label: t('dashboard.lessonsCompleted'), color: 'text-primary bg-primary/10' },
              { icon: BookOpen, value: stats.lessonsRemaining, label: t('dashboard.lessonsRemaining'), color: 'text-accent bg-accent/10' },
              { icon: FileCheck, value: stats.examsTaken, label: t('dashboard.examsTaken'), color: 'text-green-600 bg-green-100' },
              { icon: FileCheck, value: stats.examsPending, label: t('dashboard.examsPending'), color: 'text-orange-600 bg-orange-100' },
              { icon: Award, value: `${stats.averageScore}%`, label: isArabic ? 'المتوسط' : 'Average Score', color: 'text-purple-600 bg-purple-100' },
            ].map((stat, index) => (
              <div 
                key={index}
                className={cn(
                  "bg-card rounded-xl border border-border p-5 animate-fade-in-up",
                  `animation-delay-${(index + 1) * 100}`
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* No Courses Message */}
              <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in-up animation-delay-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    {t('dashboard.continueLearning')}
                  </h2>
                </div>

                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {isArabic ? 'لم تشترك في أي كورس بعد' : 'No courses enrolled yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isArabic ? 'تصفح الكورسات المتاحة وابدأ رحلة التعلم' : 'Browse available courses and start learning'}
                  </p>
                  <Button asChild>
                    <Link to="/courses">
                      {isArabic ? 'تصفح الكورسات' : 'Browse Courses'}
                      <ChevronRight className="w-4 h-4 mr-2" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in-up animation-delay-300">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {t('dashboard.recentActivity')}
                </h2>

                <div className="text-center py-8 text-muted-foreground">
                  {isArabic ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Info Card */}
              <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in-up animation-delay-400">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {isArabic ? 'معلومات الحساب' : 'Account Info'}
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {studentName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{studentName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  {profile?.phone && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">{isArabic ? 'رقم الواتساب' : 'WhatsApp'}</p>
                      <p className="font-medium text-foreground">{profile.phone}</p>
                    </div>
                  )}

                  {gradeInfo && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">{isArabic ? 'المرحلة الدراسية' : 'Grade'}</p>
                      <p className="font-medium text-foreground">{isArabic ? gradeInfo.ar : gradeInfo.en}</p>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/settings">
                    {isArabic ? 'تعديل الحساب' : 'Edit Profile'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-primary-foreground animate-fade-in-up animation-delay-500">
                <h3 className="font-bold text-lg mb-2">
                  {isArabic ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
                </h3>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  {isArabic 
                    ? 'تواصل مع المعلمين المساعدين للحصول على دعم إضافي'
                    : 'Contact assistant teachers for additional support'
                  }
                </p>
                <Button variant="secondary" className="w-full">
                  {isArabic ? 'تواصل معنا' : 'Contact Support'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;