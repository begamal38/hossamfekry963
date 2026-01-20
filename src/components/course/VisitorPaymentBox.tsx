/**
 * Visitor Payment Box - Sales Decision Module
 * 
 * For visitors who watched free lessons and are interested in enrolling.
 * Egyptian slang, youth-friendly, tech-oriented.
 */

import { useState, useEffect } from 'react';
import { Smartphone, BarChart3, Brain, Zap, Headphones, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VisitorPaymentBoxProps {
  coursePrice: number;
  courseTitle: string;
  isArabic?: boolean;
}

const VisitorPaymentBox = ({ coursePrice, courseTitle, isArabic = true }: VisitorPaymentBoxProps) => {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState<string>('');
  const [enrolledCount, setEnrolledCount] = useState<number>(0);

  // Fetch real enrolled count and student name
  useEffect(() => {
    const fetchData = async () => {
      // Fetch enrolled count
      const { count } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      setEnrolledCount(count || 0);

      // Fetch student name if logged in
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile?.full_name) {
          setStudentName(profile.full_name);
        }
      }
    };

    fetchData();
  }, [user]);

  // Generate WhatsApp message template in Egyptian Arabic
  const generateWhatsAppMessage = () => {
    const name = studentName || (isArabic ? '[اسمك]' : '[Your Name]');
    const message = isArabic
      ? `السلام عليكم يا مستر 🙌
أنا ${name}
عايز أشترك في كورس: ${courseTitle}
السعر: ${coursePrice} جنيه

ممكن أعرف تفاصيل الدفع والاشتراك؟ 🙏`
      : `Hello 🙌
I'm ${name}
I want to enroll in: ${courseTitle}
Price: ${coursePrice} EGP

Can you share the payment details? 🙏`;
    
    return encodeURIComponent(message);
  };
  
  const benefits = isArabic ? [
    {
      icon: Target,
      text: 'تتبع ذكي لتقدمك — مش مجرد علامة صح'
    },
    {
      icon: BarChart3,
      text: 'تحليل أدائك بالتفصيل — تعرف فين قوتك وضعفك'
    },
    {
      icon: Brain,
      text: 'امتحانات بتقيس فهمك — مش حفظك'
    },
    {
      icon: Zap,
      text: 'حصص مركزة بدون حشو — وقتك غالي'
    },
    {
      icon: Smartphone,
      text: 'تجربة سلسة من الموبايل — زي أي آب بتحبه'
    },
    {
      icon: Headphones,
      text: 'دعم مباشر لما تحتاج — مش هتتسيب لوحدك'
    }
  ] : [
    {
      icon: Target,
      text: 'Smart progress tracking — not just a checkmark'
    },
    {
      icon: BarChart3,
      text: 'Detailed performance analysis — know your strengths and weaknesses'
    },
    {
      icon: Brain,
      text: 'Exams that test understanding — not memorization'
    },
    {
      icon: Zap,
      text: 'Focused lessons without filler — your time matters'
    },
    {
      icon: Smartphone,
      text: 'Smooth mobile experience — like your favorite apps'
    },
    {
      icon: Headphones,
      text: 'Direct support when needed — you won\'t be left alone'
    }
  ];

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-5 sm:p-6 text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {isArabic ? 'كمّل على منصة حسام فكري' : 'Continue on Hossam Fekry Platform'}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          {isArabic 
            ? 'إنت مش بتشترك في كورس — إنت داخل سيستم بيفكّر معاك'
            : 'You\'re not just subscribing to a course — you\'re entering a system that thinks with you'}
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="p-4 sm:p-6">
        <div className="grid gap-3">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <benefit.icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="text-sm sm:text-base text-foreground leading-relaxed pt-1.5">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Price Section */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
          <p className="text-sm text-muted-foreground mb-1">
            {isArabic ? 'دخول كامل للكورس' : 'Full Course Access'}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-primary">{coursePrice}</span>
            <span className="text-lg text-primary/80 font-medium">
              {isArabic ? 'جنيه' : 'EGP'}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {isArabic ? 'طرق الدفع:' : 'Payment methods:'}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-medium">
              {isArabic ? 'فودافون كاش' : 'Vodafone Cash'}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
              {isArabic ? 'إنستاباي' : 'InstaPay'}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium">
              {isArabic ? 'تحويل بنكي' : 'Bank Transfer'}
            </span>
          </div>
        </div>
      </div>

      {/* CTA Section - Responsive sizing */}
      <div className="p-4 sm:p-6 pt-2">
        <a
          href={`https://wa.me/2001225565645?text=${generateWhatsAppMessage()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg max-w-md mx-auto"
        >
          <svg className="w-5 h-5 sm:w-5 sm:h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="leading-tight text-center">
            {isArabic 
              ? 'للدفع والاشتراك تواصل مع المدرس المساعد' 
              : 'Contact assistant teacher for payment'}
          </span>
        </a>
        
        {/* Subtext */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3">
          {isArabic 
            ? 'المدرس المساعد هيظبطك ويدخّلك فورًا'
            : 'The assistant teacher will help you get started right away'}
        </p>
      </div>

      {/* Trust Micro-Copy - Real Data */}
      <div className="px-4 sm:px-6 pb-5">
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>
              {enrolledCount > 0 
                ? `+${enrolledCount} ${isArabic ? 'طالب مشترك' : 'enrolled students'}`
                : (isArabic ? 'طلاب مشتركين' : 'enrolled students')
              }
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{isArabic ? 'رد سريع 24/7' : 'Fast response 24/7'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorPaymentBox;
