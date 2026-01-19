/**
 * Visitor Payment Box - Sales Decision Module
 * 
 * For visitors who watched free lessons and are interested in enrolling.
 * Egyptian slang, youth-friendly, tech-oriented.
 */

import { Smartphone, BarChart3, Brain, Zap, Headphones, Target } from 'lucide-react';

interface VisitorPaymentBoxProps {
  coursePrice: number;
  courseTitle: string;
  isArabic?: boolean;
}

const VisitorPaymentBox = ({ coursePrice, courseTitle, isArabic = true }: VisitorPaymentBoxProps) => {
  const whatsappMessage = encodeURIComponent(
    `عايز أشترك في كورس: ${courseTitle}`
  );
  
  const benefits = [
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
  ];

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-5 sm:p-6 text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          كمّل على منصة حسام فكري
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          إنت مش بتشترك في كورس — إنت داخل سيستم بيفكّر معاك
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
          <p className="text-sm text-muted-foreground mb-1">دخول كامل للكورس</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-primary">{coursePrice}</span>
            <span className="text-lg text-primary/80 font-medium">جنيه</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">طرق الدفع:</span>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-medium">
              فودافون كاش
            </span>
            <span className="px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
              إنستاباي
            </span>
            <span className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium">
              تحويل بنكي
            </span>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-4 sm:p-6 pt-2">
        <a
          href={`https://wa.me/201000000000?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-4 rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/30"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          كلّمنا واتساب وخُش على طول
        </a>
        
        {/* Subtext */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-3">
          المدرس المساعد هيظبطك ويدخّلك فورًا
        </p>
      </div>

      {/* Trust Micro-Copy */}
      <div className="px-4 sm:px-6 pb-5">
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>+2000 طالب مشترك</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>رد سريع 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorPaymentBox;
