import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Play, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  duration: string;
  students: number;
  lessons: number;
  isFree: boolean;
  category: string;
  categoryAr: string;
  image: string;
}

const allCourses: Course[] = [
  {
    id: '1',
    title: 'Organic Chemistry Fundamentals',
    titleAr: 'أساسيات الكيمياء العضوية',
    description: 'Master the basics of organic chemistry with clear explanations and practical examples.',
    descriptionAr: 'أتقن أساسيات الكيمياء العضوية مع شروحات واضحة وأمثلة عملية.',
    duration: '12 hours',
    students: 2500,
    lessons: 24,
    isFree: true,
    category: 'Organic Chemistry',
    categoryAr: 'الكيمياء العضوية',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    title: 'Electrochemistry Complete Course',
    titleAr: 'دورة الكيمياء الكهربائية الكاملة',
    description: 'Comprehensive coverage of electrochemistry topics for Thanaweya Amma.',
    descriptionAr: 'تغطية شاملة لموضوعات الكيمياء الكهربائية للثانوية العامة.',
    duration: '8 hours',
    students: 1800,
    lessons: 16,
    isFree: false,
    category: 'Electrochemistry',
    categoryAr: 'الكيمياء الكهربائية',
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    title: 'Chemical Equilibrium Mastery',
    titleAr: 'إتقان الاتزان الكيميائي',
    description: 'Deep dive into chemical equilibrium concepts with problem-solving strategies.',
    descriptionAr: 'دراسة معمقة لمفاهيم الاتزان الكيميائي مع استراتيجيات حل المسائل.',
    duration: '6 hours',
    students: 2100,
    lessons: 12,
    isFree: false,
    category: 'Physical Chemistry',
    categoryAr: 'الكيمياء الفيزيائية',
    image: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    title: 'Acids and Bases Complete Guide',
    titleAr: 'الدليل الكامل للأحماض والقواعد',
    description: 'Everything you need to know about acids, bases, and pH calculations.',
    descriptionAr: 'كل ما تحتاج معرفته عن الأحماض والقواعد وحسابات الـ pH.',
    duration: '10 hours',
    students: 1950,
    lessons: 20,
    isFree: true,
    category: 'Physical Chemistry',
    categoryAr: 'الكيمياء الفيزيائية',
    image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    title: 'Chemical Reactions & Stoichiometry',
    titleAr: 'التفاعلات الكيميائية والحسابات الكيميائية',
    description: 'Master chemical reactions and stoichiometric calculations.',
    descriptionAr: 'أتقن التفاعلات الكيميائية والحسابات الكيميائية.',
    duration: '9 hours',
    students: 2300,
    lessons: 18,
    isFree: false,
    category: 'General Chemistry',
    categoryAr: 'الكيمياء العامة',
    image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    title: 'Atomic Structure & Periodicity',
    titleAr: 'التركيب الذري والدورية',
    description: 'Understand atomic structure and periodic trends in depth.',
    descriptionAr: 'افهم التركيب الذري والاتجاهات الدورية بعمق.',
    duration: '7 hours',
    students: 1700,
    lessons: 14,
    isFree: true,
    category: 'General Chemistry',
    categoryAr: 'الكيمياء العامة',
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=300&fit=crop',
  },
];

const Courses: React.FC = () => {
  const { language, t } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('courses.title')}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {isArabic 
                ? 'اختر من مجموعة واسعة من الكورسات المصممة خصيصًا لطلاب الثانوية العامة'
                : 'Choose from a wide range of courses designed specifically for Thanaweya Amma students'
              }
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 animate-fade-in-up animation-delay-100">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder={isArabic ? 'ابحث عن كورس...' : 'Search courses...'} 
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              {isArabic ? 'تصفية' : 'Filter'}
            </Button>
          </div>

          {/* Courses Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allCourses.map((course, index) => (
              <div 
                key={course.id}
                className={cn(
                  "group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up",
                  `animation-delay-${((index % 3) + 1) * 100}`
                )}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={isArabic ? course.titleAr : course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  
                  {course.isFree && (
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                      {t('courses.free')}
                    </Badge>
                  )}
                  
                  <Badge variant="outline" className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm">
                    {isArabic ? course.categoryAr : course.category}
                  </Badge>
                  
                  <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Play className="w-6 h-6 text-primary-foreground ml-1" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">
                    {isArabic ? course.titleAr : course.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {isArabic ? course.descriptionAr : course.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.students.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      {course.lessons} {isArabic ? 'درس' : 'lessons'}
                    </div>
                  </div>

                  {/* CTA */}
                  <Button variant={course.isFree ? 'default' : 'outline'} className="w-full" asChild>
                    <Link to={`/courses/${course.id}`}>
                      {course.isFree ? t('courses.preview') : t('courses.enroll')}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;
