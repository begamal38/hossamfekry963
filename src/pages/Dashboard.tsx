import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  FileCheck, 
  Clock, 
  TrendingUp, 
  Play,
  ChevronRight,
  Calendar,
  Award,
  Target
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// Mock data for student dashboard
const mockStudentData = {
  name: 'Ahmed',
  nameAr: 'أحمد',
  enrolledCourses: [
    {
      id: '1',
      title: 'Organic Chemistry Fundamentals',
      titleAr: 'أساسيات الكيمياء العضوية',
      progress: 75,
      lessonsCompleted: 18,
      totalLessons: 24,
      nextLesson: 'Alkenes and Alkynes',
      nextLessonAr: 'الألكينات والألكاينات',
    },
    {
      id: '2',
      title: 'Electrochemistry Complete Course',
      titleAr: 'دورة الكيمياء الكهربائية الكاملة',
      progress: 40,
      lessonsCompleted: 6,
      totalLessons: 16,
      nextLesson: 'Galvanic Cells',
      nextLessonAr: 'الخلايا الجلفانية',
    },
  ],
  stats: {
    lessonsCompleted: 24,
    lessonsRemaining: 16,
    examsTaken: 5,
    examsPending: 3,
    averageScore: 85,
  },
  recentActivity: [
    { type: 'lesson', title: 'Completed: Aromatic Compounds', titleAr: 'اكتمل: المركبات الأروماتية', time: '2 hours ago', timeAr: 'منذ ساعتين' },
    { type: 'exam', title: 'Passed: Organic Chemistry Quiz 3', titleAr: 'اجتاز: اختبار الكيمياء العضوية 3', time: 'Yesterday', timeAr: 'أمس' },
    { type: 'lesson', title: 'Completed: Functional Groups', titleAr: 'اكتمل: المجموعات الوظيفية', time: '2 days ago', timeAr: 'منذ يومين' },
  ],
  upcomingExams: [
    { id: '1', title: 'Organic Chemistry Mid-term', titleAr: 'امتحان منتصف الكيمياء العضوية', date: 'Dec 28, 2024', dateAr: '28 ديسمبر 2024', duration: '60 min' },
    { id: '2', title: 'Electrochemistry Quiz 2', titleAr: 'اختبار الكيمياء الكهربائية 2', date: 'Jan 5, 2025', dateAr: '5 يناير 2025', duration: '30 min' },
  ],
};

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {t('dashboard.welcome')}, {isArabic ? mockStudentData.nameAr : mockStudentData.name}! 👋
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? 'استمر في رحلة تعلمك' : 'Continue your learning journey'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { icon: BookOpen, value: mockStudentData.stats.lessonsCompleted, label: t('dashboard.lessonsCompleted'), color: 'text-primary bg-primary/10' },
              { icon: BookOpen, value: mockStudentData.stats.lessonsRemaining, label: t('dashboard.lessonsRemaining'), color: 'text-accent bg-accent/10' },
              { icon: FileCheck, value: mockStudentData.stats.examsTaken, label: t('dashboard.examsTaken'), color: 'text-green-600 bg-green-100' },
              { icon: FileCheck, value: mockStudentData.stats.examsPending, label: t('dashboard.examsPending'), color: 'text-orange-600 bg-orange-100' },
              { icon: Award, value: `${mockStudentData.stats.averageScore}%`, label: isArabic ? 'المتوسط' : 'Average Score', color: 'text-purple-600 bg-purple-100' },
            ].map((stat, index) => (
              <div 
                key={index}
                className={cn(
                  "bg-card rounded-xl border border-border p-5 animate-fade-in-up",
                  `animation-delay-${(index + 1) * 100}`
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Continue Learning */}
              <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in-up animation-delay-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    {t('dashboard.continueLearning')}
                  </h2>
                </div>

                <div className="space-y-4">
                  {mockStudentData.enrolledCourses.map((course) => (
                    <div 
                      key={course.id}
                      className="group p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {isArabic ? course.titleAr : course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isArabic ? 'الدرس التالي:' : 'Next:'} {isArabic ? course.nextLessonAr : course.nextLesson}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Play className="w-4 h-4" />
                          {isArabic ? 'استمر' : 'Continue'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Progress value={course.progress} className="flex-1 h-2" />
                        <span className="text-sm font-medium text-primary">{course.progress}%</span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {course.lessonsCompleted} / {course.totalLessons} {isArabic ? 'دروس' : 'lessons'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in-up animation-delay-300">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {t('dashboard.recentActivity')}
                </h2>

                <div className="space-y-4">
                  {mockStudentData.recentActivity.map((activity, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        activity.type === 'lesson' ? 'bg-primary/10' : 'bg-green-100'
                      )}>
                        {activity.type === 'lesson' 
                          ? <BookOpen className="w-5 h-5 text-primary" />
                          : <FileCheck className="w-5 h-5 text-green-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">
                          {isArabic ? activity.titleAr : activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isArabic ? activity.timeAr : activity.time}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Exams */}
              <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in-up animation-delay-400">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t('dashboard.upcomingExams')}
                </h2>

                <div className="space-y-4">
                  {mockStudentData.upcomingExams.map((exam) => (
                    <div 
                      key={exam.id}
                      className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                    >
                      <h3 className="font-semibold text-foreground text-sm mb-2">
                        {isArabic ? exam.titleAr : exam.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="w-3 h-3" />
                        {isArabic ? exam.dateAr : exam.date}
                        <span className="mx-1">•</span>
                        <Clock className="w-3 h-3" />
                        {exam.duration}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {isArabic ? 'قادم' : 'Upcoming'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/exams">
                    {isArabic ? 'عرض كل الامتحانات' : 'View All Exams'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-primary-foreground animate-fade-in-up animation-delay-500">
                <h3 className="font-bold text-lg mb-2">
                  {isArabic ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
                </h3>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  {isArabic 
                    ? 'تواصل مع المعلمين المساعدين للحصول على دعم إضافي'
                    : 'Contact assistant teachers for additional support'
                  }
                </p>
                <Button variant="secondary" className="w-full">
                  {isArabic ? 'تواصل معنا' : 'Contact Support'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
