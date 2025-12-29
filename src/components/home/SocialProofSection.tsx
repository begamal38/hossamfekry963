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
    <section className="py-16 2xl:py-20 3xl:py-24 bg-muted/30" style={{ contain: 'layout' }}>
      <div className="container mx-auto px-4 2xl:px-8 3xl:px-12">
        {/* Section Header */}
        <div className="text-center mb-12 2xl:mb-16 3xl:mb-20">
          <span className="inline-block px-4 py-1.5 2xl:px-5 2xl:py-2 bg-primary/10 text-primary rounded-full text-sm 2xl:text-base font-medium mb-4 2xl:mb-6">
            {isArabic ? 'قصص نجاح طلابنا' : 'Student Success Stories'}
          </span>
          <h2 className="text-3xl md:text-4xl 2xl:text-5xl 3xl:text-5xl-display font-bold text-foreground mb-4 2xl:mb-6">
            {isArabic ? 'طلابنا هم فخرنا' : 'Our Students Are Our Pride'}
          </h2>
          <p className="text-muted-foreground max-w-2xl 2xl:max-w-3xl mx-auto 2xl:text-lg 3xl:text-xl leading-relaxed">
            {isArabic 
              ? 'اسمع من طلاب حققوا نتايج ممتازة في الكيمياء'
              : 'Hear from students who achieved excellent results in Chemistry'
            }
          </p>
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 2xl:gap-6 3xl:gap-8 mb-12 2xl:mb-16 3xl:mb-20">
          {achievements.map((achievement, idx) => (
            <Card key={idx} className="p-6 2xl:p-8 3xl:p-10 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 2xl:w-14 2xl:h-14 3xl:w-16 3xl:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 2xl:mb-4">
                <achievement.icon className="w-6 h-6 2xl:w-7 2xl:h-7 3xl:w-8 3xl:h-8 text-primary" />
              </div>
              <div className="text-2xl md:text-3xl 2xl:text-4xl 3xl:text-5xl font-bold text-foreground mb-1 2xl:mb-2">
                {achievement.value}
              </div>
              <p className="text-sm 2xl:text-base 3xl:text-lg text-muted-foreground">
                {isArabic ? achievement.label_ar : achievement.label_en}
              </p>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 2xl:gap-8 3xl:gap-10">
          {testimonials.map((testimonial, idx) => (
            <Card 
              key={idx} 
              className={cn(
                "p-6 2xl:p-8 3xl:p-10 relative overflow-hidden",
                "hover:shadow-lg transition-shadow duration-300"
              )}
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 end-4 w-8 h-8 2xl:w-10 2xl:h-10 text-primary/10" />
              
              {/* Score Badge */}
              <div className="flex items-center gap-2 mb-4 2xl:mb-6">
                <div className="px-3 py-1 2xl:px-4 2xl:py-1.5 bg-green-100 text-green-700 rounded-full text-sm 2xl:text-base font-bold">
                  {testimonial.score}
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 2xl:w-5 2xl:h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              {/* Testimonial Text */}
              <p className="text-foreground mb-4 2xl:mb-6 leading-relaxed 2xl:text-lg 3xl:text-xl">
                "{isArabic ? testimonial.text_ar : testimonial.text_en}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 2xl:gap-4 pt-4 2xl:pt-6 border-t border-border">
                <div className="w-10 h-10 2xl:w-12 2xl:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold 2xl:text-lg">
                    {(isArabic ? testimonial.name_ar : testimonial.name_en).charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground 2xl:text-lg">
                    {isArabic ? testimonial.name_ar : testimonial.name_en}
                  </p>
                  <p className="text-xs 2xl:text-sm text-muted-foreground">
                    {isArabic ? testimonial.grade_ar : testimonial.grade_en}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Trust Indicator */}
        <div className="mt-12 2xl:mt-16 text-center">
          <p className="text-sm 2xl:text-base 3xl:text-lg text-muted-foreground">
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
