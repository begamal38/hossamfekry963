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
    'nav.campaigns': 'Campaigns',
    'nav.about': 'About Hossam Fekry',
    'nav.settings': 'Settings',
    'nav.controlPanel': 'Control Panel',

    // Hero
    'hero.headline': 'Your complete platform to truly understand Chemistry',
    'hero.subheadline': 'Clear explanation – practical application – smart testing',
    'hero.browseCourses': 'Browse Courses',
    'hero.createAccount': 'Create Account',
    'hero.badge': 'Thanaweya Amma Chemistry',
    'hero.stats.lessons': 'Video Lessons',
    'hero.stats.students': 'Students',
    'hero.stats.success': 'Success Rate',

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
    'footer.legal': 'Legal',
    'footer.description': 'Your complete platform to truly understand Chemistry. Built for Thanaweya Amma students.',
    'footer.location': 'Cairo, Egypt',

    // Assistant Teachers
    'assistants.title': 'Assistant Teachers Portal',
    'assistants.viewStudents': 'View Students',
    'assistants.attendance': 'Attendance',
    'assistants.reports': 'Performance Reports',

    // About Page
    'about.badge': 'Chemistry Supervisor',
    'about.title': 'Who is Hossam Fekry?',
    'about.intro': 'If you are looking for someone to truly help you understand Chemistry, not just memorize it... you are in the right place.',
    'about.description1': 'Hossam Fekry is not just a teacher, he is a Chemistry Supervisor, and one of the first teachers to appear on Madrasetna Channel under the Ministry of Education since 2020.',
    'about.description2': 'His teaching experience spans over 25 years, and every year he learns something new from his students just as they learn from him.',
    'about.stats.experience': 'Years of Experience',
    'about.stats.students': 'Students Taught',
    'about.stats.channelStart': 'Madrasetna Channel Start',
    'about.stats.role': 'Chemistry Supervisor',
    'about.trust.title': 'Why Trust Hossam Fekry?',
    'about.trust.p1': 'Not just words... Hossam Fekry is a Chemistry Supervisor, meaning his main job is to oversee teachers and ensure the curriculum is taught correctly.',
    'about.trust.p2': 'When the Ministry decided to create Madrasetna Channel in 2020, he was among the teachers chosen to teach Chemistry to high school students across the country.',
    'about.trust.p3': 'So if you are asking yourself: Does he really know his stuff? The Ministry itself chose him to teach all Egyptian students.',
    'about.trust.highlight': '25 years of teaching Chemistry, seeing all types of students... those who love the subject, those who hate it, and those who do not understand why they are studying it. And he helps them all understand.',
    'about.press.title': 'What the Press Says About Hossam Fekry',
    'about.press.subtitle': 'Articles written in Egyptian newspapers about his teaching methods and student advice',
    'about.press.readArticle': 'Read Article',
    'about.platform.title': 'How Was This Platform Born?',
    'about.platform.p1': 'In 2020, when COVID turned everything upside down and everything closed, students stayed home with no one knowing what to do.',
    'about.platform.p2': 'At that time, Hossam Fekry decided not to wait for someone to solve the problem... he said he had to do something himself.',
    'about.platform.p3': 'So he built this platform so students can follow their lessons from home, without having to go to learning centers or wait for anyone.',
    'about.platform.lessons.title': 'Complete Lessons',
    'about.platform.lessons.desc': 'All lessons are recorded and available anytime, you can review and understand at your own pace.',
    'about.platform.tracking.title': 'Continuous Follow-up',
    'about.platform.tracking.desc': 'Not just explanation, there is follow-up on your attendance and grades.',
    'about.message.title': 'Hossam Fekry\'s Message to You',
    'about.message.p1': 'Chemistry is not easy... it requires work and focus.',
    'about.message.p2': 'But if you understand it correctly from the start, you will not need to memorize anything.',
    'about.message.p3': 'Hossam Fekry is here to help you understand, not memorize. To make you love the subject, not fear it.',
    'about.message.cta': 'And if you are ready to start right, he is with you.',

    // Campaigns
    'campaigns.followUs': 'Follow us on Facebook',
    'campaigns.title': 'Our Campaigns',
    'campaigns.subtitle': 'Follow our latest offers and news through our Facebook posts',
    'campaigns.facebookBanner': 'Follow our official Facebook page for the latest updates and offers',
    'campaigns.note': 'Note: Replace the post URLs above with your actual Facebook post URLs',
    'campaigns.howToGet': 'You can get the post URL by clicking on the post date and copying the link',
    'campaigns.followTitle': 'Follow Us on Facebook',
    'campaigns.followDesc': 'Join our Facebook community and be the first to know about exclusive offers and discounts',
    'campaigns.visitPage': 'Visit Our Page',
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
    'nav.campaigns': 'حملاتنا الإعلانية',
    'nav.about': 'عن حسام فكري',
    'nav.settings': 'الإعدادات',
    'nav.controlPanel': 'لوحة التحكم',

    // Hero
    'hero.headline': 'منصتك الكاملة لفهم الكيمياء بشكل حقيقي',
    'hero.subheadline': 'شرح واضح – تطبيق عملي – اختبار ذكي',
    'hero.browseCourses': 'تصفح الكورسات',
    'hero.createAccount': 'إنشاء حساب',
    'hero.badge': 'كيمياء الثانوية العامة',
    'hero.stats.lessons': 'درس فيديو',
    'hero.stats.students': 'طالب',
    'hero.stats.success': 'نسبة النجاح',

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
    'footer.legal': 'قانوني',
    'footer.description': 'منصتك الكاملة لفهم الكيمياء بشكل حقيقي. مصممة لطلاب الثانوية العامة.',
    'footer.location': 'القاهرة، مصر',

    // Assistant Teachers
    'assistants.title': 'بوابة المعلمين المساعدين',
    'assistants.viewStudents': 'عرض الطلاب',
    'assistants.attendance': 'الحضور',
    'assistants.reports': 'تقارير الأداء',

    // About Page
    'about.badge': 'موجه مادة الكيمياء',
    'about.title': 'مين حسام فكري؟',
    'about.intro': 'لو بتدور على حد يفهمك الكيمياء بجد، مش بس يحفظهالك.. يبقى إنت في المكان الصح.',
    'about.description1': 'حسام فكري مش مجرد مدرس، ده موجه لمادة الكيمياء، ومن أوائل المدرسين اللي ظهروا على قناة مدرستنا التابعة لوزارة التربية والتعليم من سنة 2020.',
    'about.description2': 'خبرته في التدريس أكتر من 25 سنة، وكل سنة بيتعلم حاجة جديدة من طلابه زي ما بيتعلموا منه.',
    'about.stats.experience': 'سنة خبرة',
    'about.stats.students': 'طالب اتعلموا معاه',
    'about.stats.channelStart': 'بداية قناة مدرستنا',
    'about.stats.role': 'مادة الكيمياء',
    'about.trust.title': 'ليه تثق في حسام فكري؟',
    'about.trust.p1': 'مش كلام وخلاص.. حسام فكري موجه مادة الكيمياء، يعني شغلته الأساسية إنه يتابع المدرسين ويتأكد إن المنهج بيتشرح صح.',
    'about.trust.p2': 'ولما الوزارة قررت تعمل قناة مدرستنا سنة 2020، كان من المدرسين اللي اختاروهم يشرحوا الكيمياء لطلاب ثانوي على مستوى الجمهورية.',
    'about.trust.p3': 'يعني لو بتسأل نفسك: ده فاهم ولا لأ؟ الوزارة نفسها اختارته يشرح لكل طلاب مصر.',
    'about.trust.highlight': '25 سنة بيدرس فيهم كيمياء، شاف فيهم كل أنواع الطلاب.. اللي بيحب المادة واللي بيكرهها، واللي مش فاهم ليه أصلا بيدرسها. وبيفهمهم كلهم.',
    'about.press.title': 'كلام الصحافة عن حسام فكري',
    'about.press.subtitle': 'مقالات اتكتبت في جرائد مصرية عن نظام التدريس ونصائح للطلاب',
    'about.press.readArticle': 'اقرأ المقال',
    'about.platform.title': 'إزاي البلاتفورم ده اتولد؟',
    'about.platform.p1': 'سنة 2020، لما كورونا قلبت الدنيا وكل حاجة اتقفلت، الطلاب فضلوا في البيوت ومحدش عارف يعمل إيه.',
    'about.platform.p2': 'في الوقت ده، حسام فكري قرر إنه ميستناش حد يحل المشكلة.. قال لازم يعمل حاجة بنفسه.',
    'about.platform.p3': 'فبنى البلاتفورم ده عشان الطالب يقدر يتابع دروسه من بيته، من غير ما يضطر يروح سناتر أو يستنى حد.',
    'about.platform.lessons.title': 'دروس كاملة',
    'about.platform.lessons.desc': 'كل الدروس متسجلة ومتاحة في أي وقت، تقدر ترجعلها وتفهمها على مهلك.',
    'about.platform.tracking.title': 'متابعة مستمرة',
    'about.platform.tracking.desc': 'مش بس شرح وخلاص، ده فيه متابعة ليك ولحضورك ودرجاتك.',
    'about.message.title': 'رسالة حسام فكري ليك',
    'about.message.p1': 'الكيمياء مش سهلة.. هي محتاجة شغل وتركيز.',
    'about.message.p2': 'بس لو فهمتها صح من الأول، مش هتحتاج تحفظ حاجة.',
    'about.message.p3': 'حسام فكري هنا عشان يفهمك، مش عشان يحفظك. عشان يخليك تحب المادة، مش تخاف منها.',
    'about.message.cta': 'ولو جاهز تبدأ صح، هو معاك.',

    // Campaigns
    'campaigns.followUs': 'تابعنا على فيسبوك',
    'campaigns.title': 'حملاتنا الإعلانية',
    'campaigns.subtitle': 'تابع آخر العروض والأخبار من خلال منشوراتنا على فيسبوك',
    'campaigns.facebookBanner': 'تابعنا على صفحتنا الرسمية على فيسبوك للحصول على آخر التحديثات والعروض',
    'campaigns.note': 'ملاحظة: استبدل روابط المنشورات أعلاه بروابط منشوراتك الفعلية من فيسبوك',
    'campaigns.howToGet': 'يمكنك الحصول على رابط المنشور من خلال الضغط على تاريخ المنشور ونسخ الرابط',
    'campaigns.followTitle': 'تابعنا على فيسبوك',
    'campaigns.followDesc': 'انضم لمجتمعنا على فيسبوك وكن أول من يعرف عن العروض والخصومات الحصرية',
    'campaigns.visitPage': 'زيارة صفحتنا',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');

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
    } else {
      // Default to Arabic
      setLanguage('ar');
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