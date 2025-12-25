import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  image: string;
}

const mockCourses: Course[] = [
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
    image: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=300&fit=crop',
  },
];

interface CourseCardProps {
  course: Course;
  index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, index }) => {
  const { language, t } = useLanguage();
  
  const title = language === 'ar' ? course.titleAr : course.title;
  const description = language === 'ar' ? course.descriptionAr : course.description;

  return (
    <div className={cn(
      "group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up",
      `animation-delay-${(index + 1) * 100}`
    )}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={course.image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        
        {course.isFree && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
            {t('courses.free')}
          </Badge>
        )}
        
        <Link 
          to={course.isFree ? "/free-lessons" : "/courses"} 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        >
          <Play className="w-6 h-6 text-primary-foreground ml-1" />
        </Link>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>

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
            {course.lessons} lessons
          </div>
        </div>

        {/* CTA */}
        <Button variant={course.isFree ? 'default' : 'outline'} className="w-full" asChild>
          <Link to={course.isFree ? "/free-lessons" : "/auth?mode=signup"}>
            {course.isFree ? t('courses.preview') : t('courses.enroll')}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const CoursesSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('courses.title')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
          </div>
          
          <Button variant="outline" className="animate-fade-in-up animation-delay-100" asChild>
            <Link to="/courses">
              {t('courses.viewAll')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
