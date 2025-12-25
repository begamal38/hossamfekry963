import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { GraduationCap, Award, Users, BookOpen, Star, Heart, Target, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import teacherImage from '@/assets/teacher.jpg';

const About = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const achievements = [
    {
      icon: Users,
      value: '10,000+',
      label: isArabic ? 'طالب وطالبة' : 'Students',
    },
    {
      icon: GraduationCap,
      value: '15+',
      label: isArabic ? 'سنة خبرة' : 'Years Experience',
    },
    {
      icon: Award,
      value: '95%',
      label: isArabic ? 'نسبة التفوق' : 'Excellence Rate',
    },
    {
      icon: BookOpen,
      value: '50+',
      label: isArabic ? 'كورس تعليمي' : 'Courses',
    },
  ];

  const values = [
    {
      icon: Target,
      title: isArabic ? 'التميز' : 'Excellence',
      description: isArabic 
        ? 'نسعى دائماً لتقديم أعلى مستوى من التعليم والشرح المبسط'
        : 'We always strive to provide the highest level of education and simplified explanations',
    },
    {
      icon: Heart,
      title: isArabic ? 'الشغف' : 'Passion',
      description: isArabic 
        ? 'حب الكيمياء هو ما يدفعنا لنقل هذا الشغف لكل طالب'
        : 'Love for chemistry is what drives us to pass this passion to every student',
    },
    {
      icon: Lightbulb,
      title: isArabic ? 'الابتكار' : 'Innovation',
      description: isArabic 
        ? 'نستخدم أحدث الطرق والتقنيات في التعليم لضمان الفهم الأفضل'
        : 'We use the latest methods and technologies in education to ensure better understanding',
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                {isArabic ? 'معلم الكيمياء' : 'Chemistry Teacher'}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {isArabic ? 'أ/ حسام فكري' : 'Mr. Hossam Fikry'}
              </h1>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {isArabic 
                  ? 'معلم كيمياء متخصص بخبرة تزيد عن 15 عاماً في تدريس الكيمياء للمرحلة الثانوية. شغفي هو تبسيط المفاهيم الكيميائية المعقدة وجعلها سهلة الفهم لجميع الطلاب.'
                  : 'A specialized chemistry teacher with over 15 years of experience in teaching chemistry for high school. My passion is simplifying complex chemical concepts and making them easy to understand for all students.'}
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {isArabic 
                  ? 'أؤمن بأن كل طالب يستطيع التفوق في الكيمياء إذا حصل على الشرح المناسب والدعم الكافي. هدفي هو مساعدة كل طالب على تحقيق أقصى إمكاناته والوصول إلى التفوق الدراسي.'
                  : 'I believe that every student can excel in chemistry if they receive the right explanation and sufficient support. My goal is to help every student achieve their maximum potential and reach academic excellence.'}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  {isArabic ? 'معلم خبير' : 'Expert Teacher'}
                </Badge>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <GraduationCap className="w-4 h-4 mr-2 text-primary" />
                  {isArabic ? 'ماجستير كيمياء' : 'MSc Chemistry'}
                </Badge>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-xl"></div>
                <img 
                  src={teacherImage} 
                  alt="Hossam Fikry"
                  className="relative w-80 h-80 md:w-96 md:h-96 object-cover rounded-3xl shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {achievements.map((stat, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-2">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {isArabic ? 'قيمنا ورؤيتنا' : 'Our Values & Vision'}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {isArabic 
                  ? 'نسعى لبناء جيل متميز من الطلاب المتفوقين في الكيمياء'
                  : 'We strive to build an exceptional generation of students excelling in chemistry'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                {isArabic ? 'قصتي مع الكيمياء' : 'My Journey with Chemistry'}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {isArabic 
                  ? 'بدأت رحلتي في تدريس الكيمياء منذ أكثر من 15 عاماً، وخلال هذه السنوات ساعدت آلاف الطلاب على فهم وحب الكيمياء. أسعى دائماً لتطوير أساليبي التعليمية ومواكبة أحدث الطرق لضمان تقديم أفضل تجربة تعليمية.'
                  : 'I started my journey in teaching chemistry over 15 years ago, and during these years I have helped thousands of students understand and love chemistry. I always strive to develop my teaching methods and keep up with the latest approaches to ensure the best educational experience.'}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {isArabic 
                  ? 'أفخر بكل طالب تخرج على يدي وحقق النجاح والتفوق. هدفي المستمر هو رؤية كل طالب يصل إلى أقصى إمكاناته ويحقق أحلامه.'
                  : 'I am proud of every student who graduated under my guidance and achieved success and excellence. My ongoing goal is to see every student reach their maximum potential and achieve their dreams.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
