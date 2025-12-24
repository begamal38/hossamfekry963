import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.freeLessons': 'Free Lessons',
    'nav.courses': 'Courses',
    'nav.dashboard': 'Dashboard',
    'nav.signUp': 'Sign Up',
    'nav.login': 'Login',
    'nav.logout': 'Logout',

    // Hero
    'hero.headline': 'Your complete platform to truly understand Chemistry',
    'hero.subheadline': 'Clear explanation – practical application – smart testing',
    'hero.browseCourses': 'Browse Courses',
    'hero.createAccount': 'Create Account',

    // Features
    'features.title': 'Why This Platform?',
    'features.understanding.title': 'Understanding, Not Memorization',
    'features.understanding.desc': 'We focus on building deep conceptual understanding rather than rote memorization.',
    'features.structured.title': 'Step-by-Step Explanation',
    'features.structured.desc': 'Complex topics broken down into clear, digestible lessons.',
    'features.tracking.title': 'Accurate Progress Tracking',
    'features.tracking.desc': 'Real-time monitoring of your learning journey with detailed analytics.',

    // Courses
    'courses.title': 'Featured Courses',
    'courses.viewAll': 'View All Courses',
    'courses.free': 'Free',
    'courses.enroll': 'Enroll Now',
    'courses.preview': 'Preview',

    // Dashboard
    'dashboard.title': 'Student Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.progress': 'Your Progress',
    'dashboard.lessonsCompleted': 'Lessons Completed',
    'dashboard.lessonsRemaining': 'Lessons Remaining',
    'dashboard.examsTaken': 'Exams Taken',
    'dashboard.examsPending': 'Exams Pending',
    'dashboard.overallProgress': 'Overall Progress',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.upcomingExams': 'Upcoming Exams',
    'dashboard.continueLearning': 'Continue Learning',

    // Footer
    'footer.contact': 'Contact',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.rights': 'All rights reserved',

    // Assistant Teachers
    'assistants.title': 'Assistant Teachers Portal',
    'assistants.viewStudents': 'View Students',
    'assistants.attendance': 'Attendance',
    'assistants.reports': 'Performance Reports',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.freeLessons': 'دروس مجانية',
    'nav.courses': 'الكورسات',
    'nav.dashboard': 'لوحة التحكم',
    'nav.signUp': 'إنشاء حساب',
    'nav.login': 'تسجيل الدخول',
    'nav.logout': 'تسجيل الخروج',

    // Hero
    'hero.headline': 'منصتك الكاملة لفهم الكيمياء بشكل حقيقي',
    'hero.subheadline': 'شرح واضح – تطبيق عملي – اختبار ذكي',
    'hero.browseCourses': 'تصفح الكورسات',
    'hero.createAccount': 'إنشاء حساب',

    // Features
    'features.title': 'لماذا هذه المنصة؟',
    'features.understanding.title': 'فهم وليس حفظ',
    'features.understanding.desc': 'نركز على بناء فهم عميق للمفاهيم بدلاً من الحفظ الأصم.',
    'features.structured.title': 'شرح خطوة بخطوة',
    'features.structured.desc': 'موضوعات معقدة مقسمة إلى دروس واضحة وسهلة الفهم.',
    'features.tracking.title': 'متابعة دقيقة للتقدم',
    'features.tracking.desc': 'مراقبة فورية لرحلة تعلمك مع تحليلات مفصلة.',

    // Courses
    'courses.title': 'الكورسات المميزة',
    'courses.viewAll': 'عرض كل الكورسات',
    'courses.free': 'مجاني',
    'courses.enroll': 'سجل الآن',
    'courses.preview': 'معاينة',

    // Dashboard
    'dashboard.title': 'لوحة تحكم الطالب',
    'dashboard.welcome': 'مرحباً بعودتك',
    'dashboard.progress': 'تقدمك',
    'dashboard.lessonsCompleted': 'الدروس المكتملة',
    'dashboard.lessonsRemaining': 'الدروس المتبقية',
    'dashboard.examsTaken': 'الامتحانات المنتهية',
    'dashboard.examsPending': 'الامتحانات القادمة',
    'dashboard.overallProgress': 'التقدم الإجمالي',
    'dashboard.recentActivity': 'النشاط الأخير',
    'dashboard.upcomingExams': 'الامتحانات القادمة',
    'dashboard.continueLearning': 'استمر في التعلم',

    // Footer
    'footer.contact': 'تواصل معنا',
    'footer.terms': 'شروط الخدمة',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.rights': 'جميع الحقوق محفوظة',

    // Assistant Teachers
    'assistants.title': 'بوابة المعلمين المساعدين',
    'assistants.viewStudents': 'عرض الطلاب',
    'assistants.attendance': 'الحضور',
    'assistants.reports': 'تقارير الأداء',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguage(savedLang);
    }
  }, []);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
