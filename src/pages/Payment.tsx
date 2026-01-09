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
  RefreshCw
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
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-20 pb-16">
        {/* Hero Section with Course Card */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent" />
          
          {/* Subtle chemistry pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          
          <div className="container relative z-10 mx-auto px-4 py-12 md:py-16">
            {/* Course Card */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border shadow-xl overflow-hidden">
                {/* Card Header with gradient */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8 border-b border-border/50">
                  <div className="flex items-start gap-4">
                    {course.thumbnail_url && (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-primary/20">
                        <img 
                          src={course.thumbnail_url} 
                          alt={isArabic ? course.title_ar : course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2 leading-tight">
                        {isArabic ? course.title_ar : course.title}
                      </h1>
                      <p className="text-sm text-muted-foreground mb-3">
                        {GRADE_OPTIONS[course.grade] || course.grade}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl md:text-4xl font-bold text-primary">
                          {course.price}
                        </span>
                        <span className="text-lg text-muted-foreground">
                          {isArabic ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Value Proposition */}
                <div className="p-6 bg-primary/5 border-b border-border/50">
                  <p className="text-center text-foreground/90 text-sm md:text-base leading-relaxed">
                    {isArabic 
                      ? 'إنت مش بتشتري فيديوهات… إنت بتدخل منصة ذكية بتتابعك خطوة بخطوة.'
                      : "You're not just buying videos… You're entering a smart platform that guides you step by step."}
                  </p>
                </div>
                
                {/* Trust Labels */}
                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                    {trustLabels.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs md:text-sm"
                      >
                        <item.icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-foreground/80">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">
              {isArabic ? 'مميزات المنصة' : 'Platform Features'}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {platformFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/90">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Methods - Visual Only */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">
              {isArabic ? 'طرق الدفع المتاحة' : 'Available Payment Methods'}
            </h2>
            
            {/* Payment Method Logos */}
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 p-6 md:p-8 bg-card rounded-2xl border border-border mb-6">
              {/* Visa */}
              <div className="flex items-center justify-center w-16 h-10 md:w-20 md:h-12 rounded-lg bg-muted/50 p-2">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <path fill="#1565C0" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                  <path fill="#FFF" d="M15.186 19l-2.626 7.832c0 0-.667-3.313-.733-3.729-1.495-3.411-3.701-3.221-3.701-3.221L10.726 30v-.002h3.161L18.258 19H15.186zM17.689 30L20.56 30 22.296 19 19.389 19zM38.008 19h-3.021l-4.71 11h2.852l.588-1.571h3.596L37.619 30h2.613L38.008 19zM34.513 26.328l1.563-4.157.818 4.157H34.513zM26.369 22.206c0-.606.498-1.057 1.926-1.057.928 0 1.991.674 1.991.674l.466-2.309c0 0-1.358-.515-2.691-.515-3.019 0-4.576 1.444-4.576 3.272 0 3.306 3.979 2.853 3.979 4.551 0 .291-.231.964-1.888.964-1.662 0-2.759-.609-2.759-.609l-.495 2.216c0 0 1.063.606 3.117.606 2.059 0 4.915-1.54 4.915-3.752C30.354 23.586 26.369 23.394 26.369 22.206z"/>
                  <path fill="#FFC107" d="M12.212,24.945l-0.966-4.748c0,0-0.437-1.029-1.573-1.029c-1.136,0-4.44,0-4.44,0S10.894,20.84,12.212,24.945z"/>
                </svg>
              </div>
              
              {/* Mastercard */}
              <div className="flex items-center justify-center w-16 h-10 md:w-20 md:h-12 rounded-lg bg-muted/50 p-2">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <path fill="#3F51B5" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                  <circle cx="30" cy="24" r="10" fill="#FF9800"/>
                  <circle cx="18" cy="24" r="10" fill="#F44336"/>
                  <path fill="#FF7043" d="M24,17.5c-2.184,1.907-3.5,4.663-3.5,7.5s1.316,5.593,3.5,7.5c2.184-1.907,3.5-4.663,3.5-7.5S26.184,19.407,24,17.5z"/>
                </svg>
              </div>
              
              {/* Vodafone Cash */}
              <div className="flex items-center justify-center w-16 h-10 md:w-20 md:h-12 rounded-lg bg-red-500/10 p-2">
                <div className="flex items-center gap-1">
                  <Wallet className="w-5 h-5 text-red-500" />
                  <span className="text-[10px] font-bold text-red-500">VF Cash</span>
                </div>
              </div>
              
              {/* InstaPay */}
              <div className="flex items-center justify-center w-16 h-10 md:w-20 md:h-12 rounded-lg bg-purple-500/10 p-2">
                <div className="flex items-center gap-1">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <span className="text-[10px] font-bold text-purple-500">InstaPay</span>
                </div>
              </div>
              
              {/* Generic Gateway */}
              <div className="flex items-center justify-center w-16 h-10 md:w-20 md:h-12 rounded-lg bg-muted/50 p-2">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
            
            {/* Calm instruction */}
            <p className="text-center text-sm text-muted-foreground mb-8">
              {isArabic 
                ? 'اختار الطريقة اللي تريحك، والتفعيل بيتم من خلال المدرس المساعد.'
                : 'Choose the method that suits you. Activation is done through the assistant teacher.'}
            </p>
            
            {/* Simple Process Note */}
            <div className="bg-primary/5 rounded-xl p-5 border border-primary/10 mb-8">
              <p className="text-center text-foreground/80 text-sm leading-relaxed">
                {isArabic 
                  ? 'بعد التحويل، ابعت صورة الإيصال على واتساب. التفعيل بيتم في وقت قصير.'
                  : 'After transfer, send the receipt screenshot on WhatsApp. Activation happens shortly.'}
              </p>
            </div>
            
            {/* WhatsApp CTA Button */}
            <Button 
              onClick={handleWhatsAppContact}
              className="w-full h-14 text-base md:text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              <MessageCircle className="w-5 h-5 me-2" />
              {isArabic 
                ? 'تأكيد الاشتراك والتواصل مع المدرس المساعد'
                : 'Confirm Subscription & Contact Assistant'}
            </Button>
          </div>
        </section>

        {/* Trust Footer Note */}
        <section className="container mx-auto px-4 pb-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm">
                {isArabic 
                  ? 'اشتراكك آمن ومضمون.'
                  : 'Your subscription is safe and guaranteed.'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              {isArabic 
                ? 'ولو محتاج أي مساعدة، المدرسين المساعدين معاك.'
                : 'If you need any help, assistant teachers are here for you.'}
            </p>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Payment;
