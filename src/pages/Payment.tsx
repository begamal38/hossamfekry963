import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowRight, 
  Copy, 
  CheckCircle, 
  Phone, 
  CreditCard,
  BookOpen,
  Clock,
  Play,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  grade: string;
  price: number;
  lessons_count: number;
  duration_hours: number;
}

const GRADE_OPTIONS: Record<string, { ar: string; en: string }> = {
  'second_arabic': { ar: 'تانية ثانوي عربي', en: '2nd Secondary - Arabic' },
  'second_languages': { ar: 'تانية ثانوي لغات', en: '2nd Secondary - Languages' },
  'third_arabic': { ar: 'تالته ثانوي عربي', en: '3rd Secondary - Arabic' },
  'third_languages': { ar: 'تالته ثانوي لغات', en: '3rd Secondary - Languages' },
};

// Payment info - can be updated
const PAYMENT_INFO = {
  vodafoneCash: '01012345678',
  instaPay: 'username@instapay',
  whatsapp: '01012345678',
};

const Payment: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
      } catch (err) {
        console.error('Error fetching course:', err);
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: isArabic ? 'تم النسخ!' : 'Copied!',
        description: isArabic ? 'تم نسخ الرقم بنجاح' : 'Number copied successfully',
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      isArabic 
        ? `مرحباً، أريد الاشتراك في كورس: ${course?.title_ar}\nالسعر: ${course?.price} ج.م\nاسمي: ${user?.email}`
        : `Hello, I want to enroll in: ${course?.title}\nPrice: ${course?.price} EGP\nMy email: ${user?.email}`
    );
    window.open(`https://wa.me/2${PAYMENT_INFO.whatsapp}?text=${message}`, '_blank');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const gradeInfo = GRADE_OPTIONS[course.grade];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Link */}
          <Link 
            to="/courses" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowRight className={cn("w-4 h-4", !isArabic && "rotate-180")} />
            {isArabic ? 'العودة للكورسات' : 'Back to Courses'}
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Course Info */}
            <div className="animate-fade-in-up">
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-primary/50" />
                </div>
                
                <div className="p-6">
                  <Badge variant="outline" className="mb-3">
                    {isArabic ? gradeInfo?.ar : gradeInfo?.en}
                  </Badge>
                  
                  <h1 className="text-2xl font-bold text-foreground mb-3">
                    {isArabic ? course.title_ar : course.title}
                  </h1>
                  
                  <p className="text-muted-foreground mb-4">
                    {isArabic ? course.description_ar : course.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration_hours} {isArabic ? 'ساعة' : 'hrs'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      {course.lessons_count} {isArabic ? 'درس' : 'lessons'}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {isArabic ? 'المبلغ المطلوب' : 'Amount Due'}
                      </span>
                      <span className="text-3xl font-bold text-primary">
                        {course.price} <span className="text-lg">{isArabic ? 'ج.م' : 'EGP'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4 animate-fade-in-up animation-delay-100">
              <h2 className="text-xl font-bold text-foreground mb-4">
                {isArabic ? 'طرق الدفع' : 'Payment Methods'}
              </h2>

              {/* Vodafone Cash */}
              <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Vodafone Cash</h3>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'فودافون كاش' : 'Mobile Wallet'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                  <span className="flex-1 font-mono text-lg text-foreground" dir="ltr">
                    {PAYMENT_INFO.vodafoneCash}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(PAYMENT_INFO.vodafoneCash, 'vodafone')}
                  >
                    {copiedField === 'vodafone' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* InstaPay */}
              <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">InstaPay</h3>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 'انستا باي' : 'Bank Transfer'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                  <span className="flex-1 font-mono text-lg text-foreground" dir="ltr">
                    {PAYMENT_INFO.instaPay}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(PAYMENT_INFO.instaPay, 'instapay')}
                  >
                    {copiedField === 'instapay' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-accent/10 rounded-xl p-5 border border-accent/20">
                <h4 className="font-bold text-foreground mb-3">
                  {isArabic ? 'خطوات الدفع' : 'Payment Steps'}
                </h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    {isArabic 
                      ? 'قم بتحويل المبلغ عبر فودافون كاش أو انستا باي'
                      : 'Transfer the amount via Vodafone Cash or InstaPay'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    {isArabic 
                      ? 'أرسل صورة إيصال التحويل على واتساب'
                      : 'Send the transfer receipt screenshot on WhatsApp'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    {isArabic 
                      ? 'سيتم تفعيل الكورس خلال ساعات قليلة'
                      : 'The course will be activated within a few hours'
                    }
                  </li>
                </ol>
              </div>

              {/* WhatsApp Button */}
              <Button 
                className="w-full gap-2 h-12 text-base bg-green-600 hover:bg-green-700"
                onClick={handleWhatsAppContact}
              >
                <MessageCircle className="w-5 h-5" />
                {isArabic ? 'تواصل على واتساب لتأكيد الدفع' : 'Contact on WhatsApp to confirm payment'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
