import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Gift, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { hasValidVideo } from '@/lib/contentVisibility';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface FreeLesson {
  id: string;
  title: string;
  title_ar: string;
  duration_minutes: number | null;
  video_url: string | null;
  course_id: string;
  courses?: {
    title_ar: string;
    title: string;
    grade: string;
  };
}

const FreeLessons: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isAssistantTeacher, loading: rolesLoading } = useUserRole();
  const isArabic = language === 'ar';
  const [lessons, setLessons] = useState<FreeLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGrade, setUserGrade] = useState<string | null>(null);

  // Check if user is staff (can see all free lessons)
  const isStaff = !rolesLoading && (isAdmin() || isAssistantTeacher());

  // Fetch user profile to get grade if logged in (students only)
  useEffect(() => {
    const fetchUserGrade = async () => {
      if (!user || isStaff) {
        setUserGrade(null);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('grade')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setUserGrade(data?.grade || null);
    };
    
    fetchUserGrade();
  }, [user, isStaff]);

  useEffect(() => {
    // Wait for roles to load before fetching
    if (rolesLoading) return;
    fetchFreeLessons();
  }, [userGrade, user, rolesLoading, isStaff]);

  const fetchFreeLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          title_ar,
          duration_minutes,
          video_url,
          course_id,
          courses!inner (
            title_ar,
            title,
            grade,
            is_primary
          )
        `)
        .eq('is_free_lesson', true)
        .eq('courses.is_primary', true) // Only from primary courses
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter to only show lessons with valid videos
      let validLessons = (data || []).filter(lesson => hasValidVideo(lesson.video_url));
      
      // ROLE-BASED FILTERING:
      // - Staff (admin/assistant): See ALL free lessons (no grade filter)
      // - Logged-in students: Filter by their grade
      // - Guests (not logged in): See ALL free lessons
      if (user && !isStaff && userGrade) {
        validLessons = validLessons.filter(lesson => 
          lesson.courses?.grade === userGrade
        );
      }
      // If staff or guest: show all (no filtering)
      
      setLessons(validLessons);
    } catch (error) {
      console.error('Error fetching free lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
  };

  const totalDuration = lessons.reduce((acc, lesson) => acc + (lesson.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalDuration / 60);
  const remainingMinutes = totalDuration % 60;

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
              <Gift className="w-3 h-3 ml-1" />
              {t('courses.free')}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('nav.freeLessons')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isArabic 
                ? 'ابدأ رحلة تعلمك مع حصص مجانية عالية الجودة'
                : 'Start your learning journey with high-quality free lessons'
              }
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mt-6" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isArabic ? 'لا توجد حصص مجانية حالياً' : 'No free lessons available'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {isArabic 
                  ? 'سيتم إضافة حصص مجانية قريباً'
                  : 'Free lessons will be added soon'
                }
              </p>
              <Button asChild>
                <Link to="/courses">
                  {isArabic ? 'استعرض الكورسات' : 'Browse Courses'}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-100">
                <div className="text-center p-4 bg-card rounded-xl border border-border">
                  <p className="text-2xl font-bold text-primary">{lessons.length}</p>
                  <p className="text-sm text-muted-foreground">{isArabic ? 'حصص مجانية' : 'Free Lessons'}</p>
                </div>
                <div className="text-center p-4 bg-card rounded-xl border border-border">
                  <p className="text-2xl font-bold text-primary">
                    {totalHours > 0 ? `${totalHours}+` : remainingMinutes}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {totalHours > 0 
                      ? (isArabic ? 'ساعات محتوى' : 'Hours Content')
                      : (isArabic ? 'دقائق محتوى' : 'Minutes Content')
                    }
                  </p>
                </div>
                <div className="text-center p-4 bg-card rounded-xl border border-border">
                  <p className="text-2xl font-bold text-primary">∞</p>
                  <p className="text-sm text-muted-foreground">{isArabic ? 'وصول مفتوح' : 'Open Access'}</p>
                </div>
              </div>

              {/* Lessons Grid */}
              <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson.id)}
                    className={cn(
                      "group flex items-center gap-4 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 animate-fade-in-up cursor-pointer",
                      `animation-delay-${((index % 4) + 1) * 100}`
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                      <Play className="w-5 h-5 text-green-600 group-hover:text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {isArabic ? lesson.title_ar : lesson.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.duration_minutes || 60} {isArabic ? 'دقيقة' : 'min'}
                        </span>
                        {lesson.courses && (
                          <span className="text-xs">
                            • {isArabic ? lesson.courses.title_ar : lesson.courses.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button size="sm" variant="outline" className="shrink-0">
                      {isArabic ? 'شاهد' : 'Watch'}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CTA */}
          <div className="text-center mt-12 animate-fade-in-up animation-delay-400">
            <p className="text-muted-foreground mb-4">
              {isArabic 
                ? 'هل تريد المزيد؟ سجل للوصول إلى جميع الكورسات'
                : 'Want more? Sign up to access all courses'
              }
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                {t('nav.signUp')}
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreeLessons;
