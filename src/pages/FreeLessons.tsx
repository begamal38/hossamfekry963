import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Gift, Loader2, CheckCircle2, UserPlus, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useFreeLessons } from '@/hooks/useFreeLessons';
import { useAuth } from '@/hooks/useAuth';

const FreeLessons: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isArabic = language === 'ar';
  
  // Use the centralized free lessons hook - single source of truth
  const { lessons, loading } = useFreeLessons();

  const handleLessonClick = (shortId: number) => {
    navigate(`/lesson/${shortId}`);
  };

  const totalDuration = lessons.reduce((acc, lesson) => acc + (lesson.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalDuration / 60);
  const remainingMinutes = totalDuration % 60;

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* STATUS FIRST: أنا فين دلوقتي؟ */}
          <div className="bg-gradient-to-br from-green-500/10 via-card to-primary/5 rounded-2xl border border-border p-5 sm:p-6 mb-6 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  {t('nav.freeLessons')}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isArabic 
                    ? 'جرب المنصة مجانًا — حصص كاملة بدون أي قيود'
                    : 'Try the platform for free — full lessons with no restrictions'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* User state-based info banner */}
          {!user ? (
            /* Visitor: Explain preview limit calmly */
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-fade-in-up animation-delay-100">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                    {isArabic ? 'وضع المعاينة' : 'Preview Mode'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic 
                      ? 'تقدر تشوف 3 دقائق من كل حصة كمعاينة. سجّل حسابك عشان تشوف الحصص كاملة مجانًا.'
                      : 'You can preview 3 minutes of each lesson. Sign up to watch full lessons for free.'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Gift className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isArabic ? 'قريباً' : 'Coming Soon'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {isArabic 
                  ? 'سيتم إضافة حصص مجانية قريباً'
                  : 'Free lessons will be added soon'
                }
              </p>
              <Button size="sm" asChild>
                <Link to="/courses">
                  {isArabic ? 'تصفح الكورسات' : 'Browse Courses'}
                </Link>
              </Button>
            </div>
          ) : (
            <>

              {/* PRIMARY ACTION: أعمل إيه دلوقتي؟ - Lessons List */}
              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson.short_id)}
                    className={cn(
                      "group flex items-center gap-4 p-4 sm:p-5 bg-card rounded-xl border border-border hover:border-green-500/40 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]",
                      "animate-fade-in-up",
                      `animation-delay-${Math.min((index % 4) + 1, 4) * 100}`
                    )}
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500 transition-colors flex-shrink-0">
                      <Play className="w-5 h-5 text-green-600 group-hover:text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                        {isArabic ? lesson.title_ar : lesson.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.duration_minutes || 60} {isArabic ? 'د' : 'min'}
                        </span>
                        {lesson.courses && (
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            • {isArabic ? lesson.courses.title_ar : lesson.courses.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <Play className="w-5 h-5 text-muted-foreground group-hover:text-green-600 transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CONTEXT: إيه اللي بعد كده؟ - State-based guidance */}
          {!user ? (
            /* Visitor: Single clear CTA */
            <div className="mt-8 p-5 bg-card rounded-2xl border border-border text-center animate-fade-in-up animation-delay-400">
              <p className="text-sm text-muted-foreground mb-4">
                {isArabic 
                  ? 'عجبتك الحصص؟ سجل حساب واستمتع بالمحتوى كامل بدون قيود'
                  : 'Liked the lessons? Sign up for unlimited access'
                }
              </p>
              <Button variant="hero" asChild className="gap-2">
                <Link to="/auth?mode=signup">
                  <UserPlus className="w-4 h-4" />
                  {isArabic ? 'إنشاء حساب مجاني' : 'Create Free Account'}
                </Link>
              </Button>
            </div>
          ) : (
            /* Logged-in: Calm confirmation, no pressure */
            <div className="mt-8 text-center animate-fade-in-up animation-delay-400">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {isArabic 
                  ? 'الحصص المجانية متاحة كاملة للحسابات المسجلة'
                  : 'Free lessons are fully available for registered accounts'
                }
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreeLessons;
