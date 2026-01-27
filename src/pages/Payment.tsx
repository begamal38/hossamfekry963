import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEnrollments } from '@/hooks/useEnrollments';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Shield, 
  Star, 
  Smartphone,
  Brain,
  BookOpen,
  Users,
  Zap,
  CreditCard,
  Wallet,
  BadgeCheck,
  Lock,
  RefreshCw,
  ChevronDown,
  UserPlus,
  Play,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { PulsingDots } from '@/components/ui/PulsingDots';

interface Course {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  price: number | null;
  grade: string;
  duration_hours: number | null;
  lessons_count: number | null;
  thumbnail_url: string | null;
  is_free: boolean | null;
}

const GRADE_OPTIONS: Record<string, string> = {
  'grade_1': 'الصف الأول الثانوي',
  'grade_2': 'الصف الثاني الثانوي',
  'grade_3': 'الصف الثالث الثانوي',
};

// Official WhatsApp number - synced with Footer
const OFFICIAL_WHATSAPP = '01225565645';

// User state types for CTA logic
type UserState = 'visitor' | 'registered_not_enrolled' | 'enrolled' | 'staff';

const Payment: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isEnrolledIn, loading: enrollmentsLoading, refreshEnrollments } = useEnrollments();
  const { isStaff, loading: roleLoading } = useUserRole();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const isArabic = isRTL;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Determine if course is free
  const isFreeCourse = useMemo(() => {
    if (!course) return false;
    return course.is_free === true || course.price === 0 || course.price === null;
  }, [course]);

  // Fetch course data - NO auth required
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error) throw error;
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error(isArabic ? 'خطأ في تحميل الكورس' : 'Error loading course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, isArabic]);

  // Derive user state from hooks - SINGLE SOURCE OF TRUTH
  const userState = useMemo((): UserState => {
    // Still loading auth/role data - treat as visitor for now
    if (authLoading || roleLoading) return 'visitor';
    
    // No user = visitor
    if (!user) return 'visitor';
    
    // Staff member (read-only)
    if (isStaff()) return 'staff';
    
    // Check enrollment status (after enrollments load)
    if (!enrollmentsLoading && courseId && isEnrolledIn(courseId)) {
      return 'enrolled';
    }
    
    // Registered but not enrolled
    return 'registered_not_enrolled';
  }, [user, authLoading, roleLoading, enrollmentsLoading, courseId, isEnrolledIn, isStaff]);

  // Handle free course enrollment - REQUIRES authenticated user
  const handleFreeEnrollment = useCallback(async () => {
    // Safety checks - NEVER enroll without user
    if (!user || !courseId) {
      toast.error(isArabic ? 'يجب تسجيل الدخول أولاً' : 'Please login first');
      navigate('/auth');
      return;
    }

    if (!isFreeCourse) {
      toast.error(isArabic ? 'هذا الكورس غير مجاني' : 'This course is not free');
      return;
    }

    setEnrolling(true);

    try {
      // Create enrollment with user_id - REQUIRED
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress: 0,
          completed_lessons: 0,
          enrolled_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
        });

      if (error) {
        // Handle duplicate enrollment gracefully
        if (error.code === '23505') {
          toast.info(isArabic ? 'أنت مشترك بالفعل في هذا الكورس' : 'You are already enrolled in this course');
          navigate(`/course/${courseId}`);
          return;
        }
        throw error;
      }

      // Send enrollment confirmation notification (non-blocking via SSOT)
      import('@/lib/notificationService').then(({ notifyEnrollmentConfirmed }) => {
        notifyEnrollmentConfirmed(user.id, course?.title_ar || 'كورس', courseId);
      }).catch(() => {});

      // Refresh enrollments cache
      await refreshEnrollments();

      toast.success(isArabic ? 'تم التسجيل بنجاح! 🎉' : 'Enrolled successfully! 🎉');
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error('Error enrolling in free course:', error);
      toast.error(isArabic ? 'حدث خطأ أثناء التسجيل' : 'Error during enrollment');
    } finally {
      setEnrolling(false);
    }
  }, [user, courseId, isFreeCourse, isArabic, navigate, refreshEnrollments]);

  // Primary CTA - WhatsApp contact (for PAID courses only)
  const handleWhatsAppContact = useCallback(() => {
    const courseName = isArabic ? course?.title_ar : course?.title;
    const gradeName = GRADE_OPTIONS[course?.grade || ''] || course?.grade;
    
    // Build message - include email only if user is logged in
    const messageParts = [
      isArabic ? 'مرحباً، أريد الاشتراك في:' : 'Hello, I want to enroll in:',
      `📚 ${courseName}`,
      `📊 ${gradeName}`,
      isArabic ? `💰 السعر: ${course?.price} ج.م` : `💰 Price: ${course?.price} EGP`,
    ];
    
    if (user?.email) {
      messageParts.push(isArabic ? `📧 الإيميل: ${user.email}` : `📧 Email: ${user.email}`);
    }
    
    messageParts.push('', isArabic ? 'منصة حسام فكري التعليمية' : 'Hossam Fekry Educational Platform');
    
    const message = encodeURIComponent(messageParts.join('\n'));
    window.open(`https://wa.me/2${OFFICIAL_WHATSAPP}?text=${message}`, '_blank');
  }, [course, user, isArabic]);

  // Primary CTA handler - routes based on course type and user state
  const handlePrimaryCTA = useCallback(() => {
    // Visitors:
    // - Paid courses: allow contact without forcing login
    // - Free courses: require login to enroll
    if (userState === 'visitor') {
      if (isFreeCourse) {
        navigate('/auth');
        return;
      }

      handleWhatsAppContact();
      return;
    }

    if (userState === 'enrolled') {
      navigate(`/course/${courseId}`);
      return;
    }

    if (userState === 'registered_not_enrolled') {
      if (isFreeCourse) {
        handleFreeEnrollment();
      } else {
        handleWhatsAppContact();
      }
    }
  }, [userState, courseId, isFreeCourse, handleFreeEnrollment, handleWhatsAppContact, navigate]);

  // Get primary CTA config based on user state and course type
  const primaryCTAConfig = useMemo(() => {
    // VISITOR
    // - Free: prompt account creation
    // - Paid: allow contact without forcing login
    if (userState === 'visitor') {
      return {
        label: isFreeCourse
          ? (isArabic ? 'أنشئ حسابك المجاني للبدء' : 'Create free account to start')
          : (isArabic ? 'تواصل للاشتراك في الكورس' : 'Contact to enroll'),
        icon: isFreeCourse ? UserPlus : MessageCircle,
        variant: 'default' as const,
        glow: true,
      };
    }

    // ENROLLED - go to course
    if (userState === 'enrolled') {
      return {
        label: isArabic ? 'اذهب إلى الكورس' : 'Go to Course',
        icon: Play,
        variant: 'default' as const,
        glow: false,
      };
    }

    // REGISTERED NOT ENROLLED
    if (userState === 'registered_not_enrolled') {
      if (isFreeCourse) {
        return {
          label: isArabic ? 'ابدأ الكورس المجاني' : 'Start Free Course',
          icon: Sparkles,
          variant: 'default' as const,
          glow: true,
        };
      } else {
        return {
          label: isArabic ? 'تواصل مع المدرس المساعد' : 'Contact Assistant',
          icon: MessageCircle,
          variant: 'default' as const,
          glow: true,
        };
      }
    }

    // STAFF - view only
    return {
      label: isArabic ? 'عرض فقط' : 'View Only',
      icon: Shield,
      variant: 'secondary' as const,
      glow: false,
    };
  }, [userState, isFreeCourse, isArabic]);

  // Loading state with pulsing dots
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PulsingDots />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{isArabic ? 'الكورس غير موجود' : 'Course not found'}</p>
      </div>
    );
  }

  const trustLabels = [
    { icon: BadgeCheck, label: isArabic ? 'محتوى مميز' : 'Premium Content' },
    { icon: Shield, label: isArabic ? 'وصول مضمون' : 'Guaranteed Access' },
    { icon: Lock, label: isArabic ? 'اشتراك آمن' : 'Secure Enrollment' },
    ...(isFreeCourse ? [] : [{ icon: RefreshCw, label: isArabic ? 'سياسة استرداد' : 'Refund Policy' }]),
  ];

  const platformFeatures = [
    { icon: Brain, text: isArabic ? 'Focus Mode يقيس تركيزك الحقيقي' : 'Focus Mode tracks your real engagement' },
    { icon: Zap, text: isArabic ? 'متابعة ذكية مش مجرد مشاهدة' : 'Smart tracking, not just views' },
    { icon: BookOpen, text: isArabic ? 'حصص منظمة بالأبواب' : 'Organized lessons by chapters' },
    { icon: Star, text: isArabic ? 'تجربة مجانية قبل الاشتراك' : 'Free trial before subscription' },
    { icon: Smartphone, text: isArabic ? 'شغال على الموبايل والكمبيوتر' : 'Works on mobile and desktop' },
    { icon: Users, text: isArabic ? 'دعم مباشر من المدرسين المساعدين' : 'Direct support from assistants' },
  ];

  const trustSignals = [
    { label: isArabic ? 'نظام متابعة' : 'Follow-up System' },
    { label: isArabic ? 'تحليل أداء' : 'Performance Analysis' },
    { label: isArabic ? 'قياس وقت حقيقي' : 'Real-time Tracking' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 pb-safe" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-28 sm:pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          
          {/* FREE COURSE BADGE */}
          {isFreeCourse && (
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                <Sparkles className="w-4 h-4 text-green-500" />
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {isArabic ? 'كورس مجاني' : 'Free Course'}
                </span>
              </div>
            </div>
          )}

          {/* HERO SECTION - Course + Price Card */}
          <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden mb-5">
            {/* Course Header */}
            <div className="p-4 sm:p-6 border-b border-border/50">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border border-border bg-muted">
                  <img 
                    src={course.thumbnail_url || '/images/default-course-cover.svg'} 
                    alt={isArabic ? course.title_ar : course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-foreground mb-1 leading-tight">
                    {isArabic ? course.title_ar : course.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    {GRADE_OPTIONS[course.grade] || course.grade}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    {isFreeCourse ? (
                      <span className="text-xl sm:text-3xl font-bold text-green-500">
                        {isArabic ? 'مجاني' : 'Free'}
                      </span>
                    ) : (
                      <>
                        <span className="text-xl sm:text-3xl font-bold text-primary">
                          {course.price}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {isArabic ? 'ج.م' : 'EGP'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Value Proposition */}
            <div className="p-3 sm:p-4 bg-primary/5">
              <p className="text-center text-foreground/90 text-xs sm:text-sm leading-relaxed">
                {isFreeCourse
                  ? (isArabic 
                      ? 'ابدأ رحلتك التعليمية مجاناً — سجّل واستمتع بالمحتوى'
                      : 'Start your learning journey for free — register and enjoy the content')
                  : (isArabic 
                      ? 'منصة ذكية بتتابعك خطوة بخطوة — مش مجرد فيديوهات'
                      : 'A smart platform that guides you step by step — not just videos')}
              </p>
            </div>
          </div>
          
          {/* Trust Labels - Compact Row */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-5">
            {trustLabels.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-card border border-border text-[10px] sm:text-xs"
              >
                <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          {/* PAYMENT METHODS - Only for PAID courses */}
          {!isFreeCourse && (
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 mb-5">
              <h2 className="text-sm sm:text-lg font-bold text-foreground mb-3 sm:mb-4 text-center">
                {isArabic ? 'طرق الدفع' : 'Payment Methods'}
              </h2>
              
              {/* Payment Logos */}
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-8 sm:w-14 sm:h-9 rounded-lg bg-muted/50 p-1">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <path fill="#1565C0" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                    <path fill="#FFF" d="M15.186 19l-2.626 7.832c0 0-.667-3.313-.733-3.729-1.495-3.411-3.701-3.221-3.701-3.221L10.726 30v-.002h3.161L18.258 19H15.186zM17.689 30L20.56 30 22.296 19 19.389 19zM38.008 19h-3.021l-4.71 11h2.852l.588-1.571h3.596L37.619 30h2.613L38.008 19zM34.513 26.328l1.563-4.157.818 4.157H34.513zM26.369 22.206c0-.606.498-1.057 1.926-1.057.928 0 1.991.674 1.991.674l.466-2.309c0 0-1.358-.515-2.691-.515-3.019 0-4.576 1.444-4.576 3.272 0 3.306 3.979 2.853 3.979 4.551 0 .291-.231.964-1.888.964-1.662 0-2.759-.609-2.759-.609l-.495 2.216c0 0 1.063.606 3.117.606 2.059 0 4.915-1.54 4.915-3.752C30.354 23.586 26.369 23.394 26.369 22.206z"/>
                    <path fill="#FFC107" d="M12.212,24.945l-0.966-4.748c0,0-0.437-1.029-1.573-1.029c-1.136,0-4.44,0-4.44,0S10.894,20.84,12.212,24.945z"/>
                  </svg>
                </div>
                <div className="flex items-center justify-center w-12 h-8 sm:w-14 sm:h-9 rounded-lg bg-muted/50 p-1">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <path fill="#3F51B5" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                    <circle cx="30" cy="24" r="10" fill="#FF9800"/>
                    <circle cx="18" cy="24" r="10" fill="#F44336"/>
                    <path fill="#FF7043" d="M24,17.5c-2.184,1.907-3.5,4.663-3.5,7.5s1.316,5.593,3.5,7.5c2.184-1.907,3.5-4.663,3.5-7.5S26.184,19.407,24,17.5z"/>
                  </svg>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-red-500">VF Cash</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-purple-500">InstaPay</span>
                </div>
              </div>
              
              {/* Simple instruction */}
              <p className="text-center text-[10px] sm:text-xs text-muted-foreground mb-4">
                {isArabic 
                  ? 'بعد التحويل، ابعت صورة الإيصال على واتساب'
                  : 'After transfer, send receipt screenshot on WhatsApp'}
              </p>
            </div>
          )}

          {/* CTA SECTION - Desktop */}
          <div className="hidden sm:block bg-card rounded-2xl border border-border p-4 sm:p-6 mb-5">
            {/* PRIMARY CTA */}
            <Button 
              onClick={handlePrimaryCTA}
              variant={primaryCTAConfig.variant}
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-lg shadow-md"
              disabled={enrolling || userState === 'staff'}
            >
                {enrolling ? (
                  <Loader2 className="w-5 h-5 me-2 animate-spin" />
                ) : (
                  <primaryCTAConfig.icon className="w-4 h-4 sm:w-5 sm:h-5 me-2" />
                )}
              {enrolling ? (isArabic ? 'جاري التسجيل...' : 'Enrolling...') : primaryCTAConfig.label}
            </Button>

            {/* Visitor hint */}
            {userState === 'visitor' && (
              <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-3">
                {isArabic 
                  ? 'التسجيل مجاني — لا يتطلب بطاقة ائتمان'
                  : 'Registration is free — no credit card required'}
              </p>
            )}
          </div>
          
          {/* Trust Signals - Clean chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {trustSignals.map((signal, index) => (
              <span 
                key={index}
                className="px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-[10px] sm:text-xs font-medium"
              >
                {signal.label}
              </span>
            ))}
          </div>
          
          {/* Platform Features - Collapsed by default on mobile */}
          <details className="bg-card rounded-2xl border border-border overflow-hidden mb-5 group">
            <summary className="p-3 sm:p-5 cursor-pointer flex items-center justify-between list-none">
              <span className="font-semibold text-foreground text-xs sm:text-base">
                {isArabic ? 'مميزات المنصة' : 'Platform Features'}
              </span>
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-3 sm:px-5 pb-3 sm:pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {platformFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-muted/50"
                >
                  <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm text-foreground/80">{feature.text}</span>
                </div>
              ))}
            </div>
          </details>
          
          {/* Trust Footer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground text-[10px] sm:text-xs">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>
                {isArabic 
                  ? 'اشتراكك آمن — والمدرسين المساعدين معاك لأي استفسار'
                  : 'Secure subscription — assistants are here for any questions'}
              </span>
            </div>
          </div>
        </div>
      </main>
      
      {/* MOBILE STICKY CTA BAR */}
      {isMobile && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 safe-area-inset-bottom">
          <Button 
            onClick={handlePrimaryCTA}
            variant={primaryCTAConfig.variant}
            className="w-full h-11 text-sm font-bold rounded-xl shadow-lg"
            disabled={enrolling || userState === 'staff'}
          >
            {enrolling ? (
              <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
            ) : (
              <primaryCTAConfig.icon className="w-4 h-4 me-1.5" />
            )}
            {enrolling 
              ? (isArabic ? 'جاري التسجيل...' : 'Enrolling...') 
              : (isMobile && userState === 'registered_not_enrolled' && !isFreeCourse)
                ? (isArabic ? 'تواصل الآن' : 'Contact Now')
                : primaryCTAConfig.label
            }
          </Button>
          
          {/* Visitor hint on mobile */}
          {userState === 'visitor' && (
            <p className="text-center text-[9px] text-muted-foreground mt-1.5">
              {isArabic ? 'التسجيل مجاني' : 'Free registration'}
            </p>
          )}
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Payment;
