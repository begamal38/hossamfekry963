import React from 'react';
import { Star, Quote, GraduationCap, Trophy, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    name_ar: 'أحمد محمد',
    name_en: 'Ahmed Mohamed',
    grade_ar: 'ثانوية عامة 2024',
    grade_en: 'Thanaweya 2024',
    text_ar: 'شرح مستر حسام فكري خلاني أفهم الكيمياء من الأول وأحب المادة. أخيرًا فهمت الموازنة!',
    text_en: "Mr. Hossam Fekry's explanation made me understand Chemistry from the start. Finally understood balancing equations!",
    score: '95%'
  },
  {
    name_ar: 'سارة أحمد',
    name_en: 'Sara Ahmed',
    grade_ar: 'ثانوية عامة 2024',
    grade_en: 'Thanaweya 2024',
    text_ar: 'كنت بكره الكيمياء بس بعد ما اتعلمت مع مستر حسام بقت المادة المفضلة عندي.',
    text_en: 'I used to hate Chemistry but after learning with Mr. Hossam it became my favorite subject.',
    score: '92%'
  },
  {
    name_ar: 'محمد علي',
    name_en: 'Mohamed Ali',
    grade_ar: 'ثانوية عامة 2023',
    grade_en: 'Thanaweya 2023',
    text_ar: 'أسلوب الشرح بسيط ومفهوم، والامتحانات بتجهزك صح للامتحان النهائي.',
    text_en: 'Simple and clear teaching style, and the exams prepare you well for the final.',
    score: '98%'
  }
];

const achievements = [
  {
    icon: Trophy,
    value: '25+',
    label_ar: 'سنة خبرة',
    label_en: 'Years Experience'
  },
  {
    icon: Users,
    value: '10,000+',
    label_ar: 'طالب',
    label_en: 'Students'
  },
  {
    icon: GraduationCap,
    value: '95%',
    label_ar: 'نسبة النجاح',
    label_en: 'Success Rate'
  },
  {
    icon: Star,
    value: '4.9',
    label_ar: 'تقييم الطلاب',
    label_en: 'Student Rating'
  }
];

export const SocialProofSection: React.FC = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {isArabic ? 'قصص نجاح طلابنا' : 'Student Success Stories'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isArabic ? 'طلابنا هم فخرنا' : 'Our Students Are Our Pride'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isArabic 
              ? 'اسمع من طلاب حققوا نتايج ممتازة في الكيمياء'
              : 'Hear from students who achieved excellent results in Chemistry'
            }
          </p>
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {achievements.map((achievement, idx) => (
            <Card key={idx} className="p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <achievement.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {achievement.value}
              </div>
              <p className="text-sm text-muted-foreground">
                {isArabic ? achievement.label_ar : achievement.label_en}
              </p>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <Card 
              key={idx} 
              className={cn(
                "p-6 relative overflow-hidden",
                "hover:shadow-lg transition-shadow duration-300"
              )}
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 end-4 w-8 h-8 text-primary/10" />
              
              {/* Score Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                  {testimonial.score}
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Testimonial Text */}
              <p className="text-foreground mb-4 leading-relaxed">
                "{isArabic ? testimonial.text_ar : testimonial.text_en}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">
                    {(isArabic ? testimonial.name_ar : testimonial.name_en).charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {isArabic ? testimonial.name_ar : testimonial.name_en}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? testimonial.grade_ar : testimonial.grade_en}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Trust Indicator */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isArabic 
              ? 'موثوق به من آلاف الطلاب وأولياء الأمور في جميع أنحاء مصر'
              : 'Trusted by thousands of students and parents across Egypt'
            }
          </p>
        </div>
      </div>
    </section>
  );
};
