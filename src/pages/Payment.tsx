import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Shield, 
  CheckCircle, 
  Star, 
  Smartphone,
  Monitor,
  Brain,
  BookOpen,
  Users,
  Zap,
  CreditCard,
  Wallet,
  BadgeCheck,
  Lock,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

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
}

const GRADE_OPTIONS: Record<string, string> = {
  'grade_1': 'الصف الأول الثانوي',
  'grade_2': 'الصف الثاني الثانوي',
  'grade_3': 'الصف الثالث الثانوي',
};

// Official WhatsApp number - synced with Footer
const OFFICIAL_WHATSAPP = '01225565645';

const Payment: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const isArabic = isRTL;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

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

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      isArabic 
        ? `مرحباً، أريد الاشتراك في كورس: ${course?.title_ar}\nالسعر: ${course?.price} ج.م\nاسمي: ${user?.email}`
        : `Hello, I want to enroll in: ${course?.title}\nPrice: ${course?.price} EGP\nMy email: ${user?.email}`
    );
    window.open(`https://wa.me/2${OFFICIAL_WHATSAPP}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
    { icon: RefreshCw, label: isArabic ? 'سياسة استرداد' : 'Refund Policy' },
  ];

  const platformFeatures = [
    { icon: Brain, text: isArabic ? 'Focus Mode يقيس تركيزك الحقيقي' : 'Focus Mode tracks your real engagement' },
    { icon: Zap, text: isArabic ? 'متابعة ذكية مش مجرد مشاهدة' : 'Smart tracking, not just views' },
    { icon: BookOpen, text: isArabic ? 'حصص منظمة بالأبواب' : 'Organized lessons by chapters' },
    { icon: Star, text: isArabic ? 'تجربة مجانية قبل الاشتراك' : 'Free trial before subscription' },
    { icon: Smartphone, text: isArabic ? 'شغال على الموبايل والكمبيوتر' : 'Works on mobile and desktop' },
    { icon: Users, text: isArabic ? 'دعم مباشر من المدرسين المساعدين' : 'Direct support from assistants' },
  ];

  return (
    <div className="min-h-screen bg-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          
          {/* STATUS FIRST: أنا فين دلوقتي؟ - Course + Price Card */}
          <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden mb-6">
            {/* Course Header */}
            <div className="p-5 sm:p-6 border-b border-border/50">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border border-border bg-muted">
                  <img 
                    src={course.thumbnail_url || '/images/default-course-cover.svg'} 
                    alt={isArabic ? course.title_ar : course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground mb-1 leading-tight">
                    {isArabic ? course.title_ar : course.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    {GRADE_OPTIONS[course.grade] || course.grade}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-bold text-primary">
                      {course.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isArabic ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Value Proposition - Simple */}
            <div className="p-4 sm:p-5 bg-primary/5">
              <p className="text-center text-foreground/90 text-sm leading-relaxed">
                {isArabic 
                  ? 'منصة ذكية بتتابعك خطوة بخطوة — مش مجرد فيديوهات'
                  : 'A smart platform that guides you step by step — not just videos'}
              </p>
            </div>
          </div>
          
          {/* Trust Labels - Compact Row */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {trustLabels.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs"
              >
                <item.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          {/* PRIMARY ACTION: أعمل إيه دلوقتي؟ - Payment Methods + CTA */}
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 mb-6">
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 text-center">
              {isArabic ? 'طرق الدفع' : 'Payment Methods'}
            </h2>
            
            {/* Payment Logos - Simple Row */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-14 h-9 rounded-lg bg-muted/50 p-1.5">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <path fill="#1565C0" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                  <path fill="#FFF" d="M15.186 19l-2.626 7.832c0 0-.667-3.313-.733-3.729-1.495-3.411-3.701-3.221-3.701-3.221L10.726 30v-.002h3.161L18.258 19H15.186zM17.689 30L20.56 30 22.296 19 19.389 19zM38.008 19h-3.021l-4.71 11h2.852l.588-1.571h3.596L37.619 30h2.613L38.008 19zM34.513 26.328l1.563-4.157.818 4.157H34.513zM26.369 22.206c0-.606.498-1.057 1.926-1.057.928 0 1.991.674 1.991.674l.466-2.309c0 0-1.358-.515-2.691-.515-3.019 0-4.576 1.444-4.576 3.272 0 3.306 3.979 2.853 3.979 4.551 0 .291-.231.964-1.888.964-1.662 0-2.759-.609-2.759-.609l-.495 2.216c0 0 1.063.606 3.117.606 2.059 0 4.915-1.54 4.915-3.752C30.354 23.586 26.369 23.394 26.369 22.206z"/>
                  <path fill="#FFC107" d="M12.212,24.945l-0.966-4.748c0,0-0.437-1.029-1.573-1.029c-1.136,0-4.44,0-4.44,0S10.894,20.84,12.212,24.945z"/>
                </svg>
              </div>
              <div className="flex items-center justify-center w-14 h-9 rounded-lg bg-muted/50 p-1.5">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <path fill="#3F51B5" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                  <circle cx="30" cy="24" r="10" fill="#FF9800"/>
                  <circle cx="18" cy="24" r="10" fill="#F44336"/>
                  <path fill="#FF7043" d="M24,17.5c-2.184,1.907-3.5,4.663-3.5,7.5s1.316,5.593,3.5,7.5c2.184-1.907,3.5-4.663,3.5-7.5S26.184,19.407,24,17.5z"/>
                </svg>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10">
                <Wallet className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold text-red-500">VF Cash</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10">
                <CreditCard className="w-4 h-4 text-purple-500" />
                <span className="text-[10px] font-bold text-purple-500">InstaPay</span>
              </div>
            </div>
            
            {/* Simple instruction */}
            <p className="text-center text-xs text-muted-foreground mb-5">
              {isArabic 
                ? 'بعد التحويل، ابعت صورة الإيصال على واتساب'
                : 'After transfer, send receipt screenshot on WhatsApp'}
            </p>
            
            {/* SINGLE CTA with Glow Effect */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-xl blur-md opacity-60 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
              <Button 
                onClick={handleWhatsAppContact}
                className="relative w-full h-12 sm:h-14 text-base font-bold rounded-xl shadow-lg"
              >
                <MessageCircle className="w-5 h-5 me-2" />
                {isArabic ? 'تواصل مع المدرس المساعد' : 'Contact Assistant'}
              </Button>
            </div>
          </div>
          
          {/* CONTEXT: Platform Features - Collapsed by default on mobile */}
          <details className="bg-card rounded-2xl border border-border overflow-hidden mb-6 group">
            <summary className="p-4 sm:p-5 cursor-pointer flex items-center justify-between list-none">
              <span className="font-semibold text-foreground text-sm sm:text-base">
                {isArabic ? 'مميزات المنصة' : 'Platform Features'}
              </span>
              <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {platformFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50"
                >
                  <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground/80">{feature.text}</span>
                </div>
              ))}
            </div>
          </details>
          
          {/* Trust Footer - Subtle */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>
                {isArabic 
                  ? 'اشتراكك آمن — والمدرسين المساعدين معاك لأي استفسار'
                  : 'Secure subscription — assistants are here for any questions'}
              </span>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Payment;
