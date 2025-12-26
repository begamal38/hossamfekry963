import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIXED BILINGUAL TERMINOLOGY DICTIONARY
// Arabic uses Egyptian colloquial Arabic (عامية مصرية محترمة)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const translations: Record<Language, Record<string, string>> = {
  en: {
    // ══════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ══════════════════════════════════════════════════════════════════════════
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

    // ══════════════════════════════════════════════════════════════════════════
    // DASHBOARD & PROGRESS
    // ══════════════════════════════════════════════════════════════════════════
    'dashboard': 'Dashboard',
    'dashboard.title': 'Dashboard',
    'dashboard.student': 'Student Dashboard',
    'dashboard.assistant': 'Assistant Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.yourProgress': 'Your Progress',
    'dashboard.overallProgress': 'Overall Progress',
    'dashboard.lessonsCompleted': 'Lessons Completed',
    'dashboard.lessonsRemaining': 'Lessons Remaining',
    'dashboard.examsTaken': 'Exams Taken',
    'dashboard.examsPending': 'Exams Pending',
    'dashboard.progressSaved': 'Progress Saved',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.continueLearning': 'Continue Learning',
    'dashboard.accountInfo': 'Account Info',
    'dashboard.editProfile': 'Edit Profile',
    'dashboard.startNow': 'Start Now!',
    'dashboard.continueJourney': 'Continue your learning journey and achieve your goals',
    'dashboard.browseCourses': 'Browse Courses',

    // ══════════════════════════════════════════════════════════════════════════
    // LESSONS
    // ══════════════════════════════════════════════════════════════════════════
    'lesson': 'Lesson',
    'lessons': 'Lessons',
    'lesson.start': 'Start Lesson',
    'lesson.continue': 'Continue Lesson',
    'lesson.review': 'Review Lesson',
    'lesson.completed': 'Lesson Completed',
    'lesson.inProgress': 'Lesson In Progress',
    'lesson.notStarted': 'Lesson Not Started',
    'lesson.activity': 'Lesson Activity',
    'lesson.lastAccessed': 'Last accessed',
    'lesson.noLessons': 'No lessons yet',
    'lesson.manage': 'Manage Lessons',
    'lesson.add': 'Add Lesson',
    'lesson.edit': 'Edit Lesson',
    'lesson.delete': 'Delete Lesson',
    'lesson.title': 'Lesson Title',
    'lesson.titleAr': 'Lesson Title (Arabic)',
    'lesson.type': 'Lesson Type',
    'lesson.online': 'Online Lesson',
    'lesson.center': 'Center Lesson',
    'lesson.duration': 'Duration (minutes)',
    'lesson.order': 'Order',

    // ══════════════════════════════════════════════════════════════════════════
    // EXAMS
    // ══════════════════════════════════════════════════════════════════════════
    'exam': 'Exam',
    'exams': 'Exams',
    'exam.take': 'Take Exam',
    'exam.taken': 'Exam Taken',
    'exam.notTaken': 'Exam Not Taken',
    'exam.pending': 'Exam Pending',
    'exam.yourScore': 'Your Score',
    'exam.attempt': 'Attempt',
    'exam.attemptsLeft': 'Attempts Left',
    'exam.manage': 'Manage Exams',
    'exam.add': 'Add Exam',
    'exam.results': 'Exam Results',
    'exam.maxScore': 'Max Score',
    'exam.date': 'Exam Date',
    'exam.recordGrades': 'Record Grades',
    'exam.noExams': 'No exams yet',

    // ══════════════════════════════════════════════════════════════════════════
    // ATTENDANCE
    // ══════════════════════════════════════════════════════════════════════════
    'attendance': 'Attendance',
    'attendance.record': 'Record Attendance',
    'attendance.attendedCenter': 'Attended in Center',
    'attendance.completedOnline': 'Completed Online',
    'attendance.notAttended': 'Not Attended',
    'attendance.hybrid': 'Hybrid Attendance',
    'attendance.status': 'Attendance Status',
    'attendance.full': 'Full Attendance',
    'attendance.centerOnly': 'Center Only',
    'attendance.onlineOnly': 'Online Only',
    'attendance.absent': 'Absent',
    'attendance.mode': 'Attendance Mode',
    'attendance.filterByMode': 'Filter by Attendance Mode',
    'attendance.all': 'All',
    'attendance.save': 'Save Attendance',
    'attendance.saving': 'Saving...',
    'attendance.legend': 'Status Legend',
    'attendance.selectLesson': 'Please select a lesson',
    'attendance.recordedFor': 'Recorded attendance for',
    'attendance.students': 'students',
    'attendance.failedSave': 'Failed to save attendance',

    // ══════════════════════════════════════════════════════════════════════════
    // ATTENDANCE MODES
    // ══════════════════════════════════════════════════════════════════════════
    'mode.online': 'Online',
    'mode.center': 'Center',
    'mode.hybrid': 'Hybrid',
    'mode.change': 'Change Mode',
    'mode.changeConfirm': 'Are you sure you want to change the attendance mode?',
    'mode.changeNote': 'This affects attendance tracking and reports',
    'mode.updated': 'Attendance mode updated successfully',
    'mode.updateFailed': 'Failed to update attendance mode',

    // ══════════════════════════════════════════════════════════════════════════
    // ROLES
    // ══════════════════════════════════════════════════════════════════════════
    'role.student': 'Student',
    'role.assistant': 'Assistant Teacher',
    'role.admin': 'Admin',

    // ══════════════════════════════════════════════════════════════════════════
    // COURSES
    // ══════════════════════════════════════════════════════════════════════════
    'course': 'Course',
    'courses': 'Courses',
    'courses.title': 'Featured Courses',
    'courses.viewAll': 'View All Courses',
    'courses.free': 'Free',
    'courses.enroll': 'Enroll Now',
    'courses.preview': 'Preview',
    'courses.manage': 'Manage Courses',
    'courses.add': 'Add Course',
    'courses.edit': 'Edit Course',
    'courses.delete': 'Delete Course',
    'courses.progress': 'Course Progress',
    'courses.noEnrolled': 'No courses enrolled yet',
    'courses.browseAvailable': 'Browse available courses and start learning',

    // ══════════════════════════════════════════════════════════════════════════
    // STUDENTS
    // ══════════════════════════════════════════════════════════════════════════
    'students': 'Students',
    'students.enrolled': 'Enrolled Students',
    'students.view': 'View Students',
    'students.details': 'Student Details',
    'students.noStudents': 'No students found',
    'students.noName': 'No name',
    'students.manage': 'Manage Students',

    // ══════════════════════════════════════════════════════════════════════════
    // ENROLLMENTS
    // ══════════════════════════════════════════════════════════════════════════
    'enrollments': 'Enrollments',
    'enrollments.manage': 'Manage Enrollments',
    'enrollments.pending': 'pending',
    'enrollments.active': 'Active',

    // ══════════════════════════════════════════════════════════════════════════
    // REPORTS
    // ══════════════════════════════════════════════════════════════════════════
    'reports': 'Reports',
    'reports.title': 'Reports & Statistics',
    'reports.overview': 'Overview of student performance and attendance',
    'reports.avgProgress': 'Avg Progress',
    'reports.avgScore': 'Avg Score',
    'reports.topStudents': 'Top Students (by Exam Scores)',
    'reports.noResults': 'No exam results yet',
    'reports.courseStats': 'Course Statistics',
    'reports.noCourses': 'No courses yet',
    'reports.studentsByMode': 'Students by Attendance Mode',
    'reports.attendanceBreakdown': 'Attendance Breakdown by Lesson',
    'reports.noAttendance': 'No attendance data yet',
    'reports.attendanceRecords': 'attendance records',
    'reports.attendBoth': 'Attend both center & online',
    'reports.both': 'Both',

    // ══════════════════════════════════════════════════════════════════════════
    // SYSTEM MESSAGES
    // ══════════════════════════════════════════════════════════════════════════
    'system.welcome': 'Welcome',
    'system.noContent': 'No content available yet',
    'system.allCaughtUp': 'You are all caught up',
    'system.progressSaved': 'Your progress is saved',
    'system.cannotUndo': 'This action cannot be undone',
    'system.groupFixed': 'Group cannot be changed',
    'system.loading': 'Loading...',
    'system.error': 'Error',
    'system.success': 'Success',
    'system.save': 'Save',
    'system.cancel': 'Cancel',
    'system.delete': 'Delete',
    'system.edit': 'Edit',
    'system.add': 'Add',
    'system.view': 'View',
    'system.back': 'Back',
    'system.next': 'Next',
    'system.confirm': 'Confirm',
    'system.close': 'Close',
    'system.search': 'Search',
    'system.filter': 'Filter',
    'system.noData': 'No data',
    'system.viewAll': 'View All',

    // ══════════════════════════════════════════════════════════════════════════
    // FORMS
    // ══════════════════════════════════════════════════════════════════════════
    'form.title': 'Title',
    'form.titleAr': 'Title (Arabic)',
    'form.description': 'Description',
    'form.descriptionAr': 'Description (Arabic)',
    'form.price': 'Price',
    'form.grade': 'Grade',
    'form.selectCourse': 'Select Course',
    'form.selectLesson': 'Select Lesson',
    'form.selectExam': 'Select Exam',
    'form.score': 'Score',
    'form.notes': 'Notes',
    'form.phone': 'Phone',
    'form.whatsapp': 'WhatsApp',
    'form.academicGroup': 'Academic Group',

    // ══════════════════════════════════════════════════════════════════════════
    // HERO SECTION
    // ══════════════════════════════════════════════════════════════════════════
    'hero.headline': 'Your complete platform to truly understand Chemistry',
    'hero.subheadline': 'Clear explanation – practical application – smart testing',
    'hero.browseCourses': 'Browse Courses',
    'hero.createAccount': 'Create Account',
    'hero.badge': 'Thanaweya Amma Chemistry',
    'hero.stats.lessons': 'Video Lessons',
    'hero.stats.students': 'Students',
    'hero.stats.success': 'Success Rate',

    // ══════════════════════════════════════════════════════════════════════════
    // FEATURES
    // ══════════════════════════════════════════════════════════════════════════
    'features.title': 'Why This Platform?',
    'features.understanding.title': 'Understanding, Not Memorization',
    'features.understanding.desc': 'We focus on building deep conceptual understanding rather than rote memorization.',
    'features.structured.title': 'Step-by-Step Explanation',
    'features.structured.desc': 'Complex topics broken down into clear, digestible lessons.',
    'features.tracking.title': 'Accurate Progress Tracking',
    'features.tracking.desc': 'Real-time monitoring of your learning journey with detailed analytics.',

    // ══════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════════════════════════════════════════
    'footer.contact': 'Contact',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.rights': 'All rights reserved',
    'footer.legal': 'Legal',
    'footer.description': 'Your complete platform to truly understand Chemistry. Built for Thanaweya Amma students.',
    'footer.location': 'Cairo, Egypt',

    // ══════════════════════════════════════════════════════════════════════════
    // ASSISTANT PORTAL
    // ══════════════════════════════════════════════════════════════════════════
    'assistant.portal': 'Assistant Teachers Portal',
    'assistant.dashboard': 'Assistant Dashboard',
    'assistant.manageCourses': 'Manage Courses',
    'assistant.manageLessons': 'Manage Lessons',
    'assistant.manageExams': 'Manage Exams',
    'assistant.recordAttendance': 'Record Attendance',
    'assistant.recordGrades': 'Record Grades',
    'assistant.viewReports': 'View Reports',

    // ══════════════════════════════════════════════════════════════════════════
    // ABOUT PAGE
    // ══════════════════════════════════════════════════════════════════════════
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
    'about.message.title': "Hossam Fekry's Message to You",
    'about.message.p1': 'Chemistry is not easy... it requires work and focus.',
    'about.message.p2': 'But if you understand it correctly from the start, you will not need to memorize anything.',
    'about.message.p3': 'Hossam Fekry is here to help you understand, not memorize. To make you love the subject, not fear it.',
    'about.message.cta': 'And if you are ready to start right, he is with you.',

    // ══════════════════════════════════════════════════════════════════════════
    // CAMPAIGNS
    // ══════════════════════════════════════════════════════════════════════════
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
    // ══════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ══════════════════════════════════════════════════════════════════════════
    'nav.home': 'الرئيسية',
    'nav.freeLessons': 'حصص مجانية',
    'nav.courses': 'الكورسات',
    'nav.dashboard': 'لوحة التحكم',
    'nav.signUp': 'إنشاء حساب',
    'nav.login': 'تسجيل الدخول',
    'nav.logout': 'تسجيل الخروج',
    'nav.campaigns': 'حملاتنا الإعلانية',
    'nav.about': 'عن حسام فكري',
    'nav.settings': 'الإعدادات',
    'nav.controlPanel': 'لوحة التحكم',

    // ══════════════════════════════════════════════════════════════════════════
    // DASHBOARD & PROGRESS
    // ══════════════════════════════════════════════════════════════════════════
    'dashboard': 'لوحة التحكم',
    'dashboard.title': 'لوحة التحكم',
    'dashboard.student': 'لوحة تحكم الطالب',
    'dashboard.assistant': 'لوحة تحكم المدرس المساعد',
    'dashboard.welcome': 'أهلاً بيك',
    'dashboard.yourProgress': 'تقدمك',
    'dashboard.overallProgress': 'التقدم الكلي',
    'dashboard.lessonsCompleted': 'حصص خلصتها',
    'dashboard.lessonsRemaining': 'حصص فاضلة',
    'dashboard.examsTaken': 'امتحانات اتحلت',
    'dashboard.examsPending': 'امتحانات لسه',
    'dashboard.progressSaved': 'تقدمك محفوظ',
    'dashboard.recentActivity': 'النشاط الأخير',
    'dashboard.continueLearning': 'كمل تعلمك',
    'dashboard.accountInfo': 'معلومات الحساب',
    'dashboard.editProfile': 'تعديل الحساب',
    'dashboard.startNow': 'ابدأ دلوقتي!',
    'dashboard.continueJourney': 'كمل رحلة التعلم وحقق أهدافك',
    'dashboard.browseCourses': 'تصفح الكورسات',

    // ══════════════════════════════════════════════════════════════════════════
    // LESSONS (حصص)
    // ══════════════════════════════════════════════════════════════════════════
    'lesson': 'حصة',
    'lessons': 'حصص',
    'lesson.start': 'ابدأ الحصة',
    'lesson.continue': 'كمل الحصة',
    'lesson.review': 'راجع الحصة',
    'lesson.completed': 'الحصة خلصت',
    'lesson.inProgress': 'الحصة شغالة',
    'lesson.notStarted': 'لسه ما بدأتش الحصة',
    'lesson.activity': 'نشاط الحصص',
    'lesson.lastAccessed': 'آخر حصة',
    'lesson.noLessons': 'لسه مفيش حصص',
    'lesson.manage': 'إدارة الحصص',
    'lesson.add': 'أضف حصة',
    'lesson.edit': 'عدل الحصة',
    'lesson.delete': 'احذف الحصة',
    'lesson.title': 'عنوان الحصة',
    'lesson.titleAr': 'عنوان الحصة (عربي)',
    'lesson.type': 'نوع الحصة',
    'lesson.online': 'حصة أونلاين',
    'lesson.center': 'حصة في السنتر',
    'lesson.duration': 'المدة (بالدقايق)',
    'lesson.order': 'الترتيب',

    // ══════════════════════════════════════════════════════════════════════════
    // EXAMS (امتحانات)
    // ══════════════════════════════════════════════════════════════════════════
    'exam': 'امتحان',
    'exams': 'امتحانات',
    'exam.take': 'ادخل الامتحان',
    'exam.taken': 'الامتحان اتحل',
    'exam.notTaken': 'الامتحان لسه',
    'exam.pending': 'امتحان مستنيك',
    'exam.yourScore': 'درجتك',
    'exam.attempt': 'محاولة',
    'exam.attemptsLeft': 'محاولات فاضلة',
    'exam.manage': 'إدارة الامتحانات',
    'exam.add': 'أضف امتحان',
    'exam.results': 'نتايج الامتحانات',
    'exam.maxScore': 'الدرجة العظمى',
    'exam.date': 'تاريخ الامتحان',
    'exam.recordGrades': 'سجل الدرجات',
    'exam.noExams': 'لسه مفيش امتحانات',

    // ══════════════════════════════════════════════════════════════════════════
    // ATTENDANCE (الحضور)
    // ══════════════════════════════════════════════════════════════════════════
    'attendance': 'الحضور',
    'attendance.record': 'سجل الحضور',
    'attendance.attendedCenter': 'حضر في السنتر',
    'attendance.completedOnline': 'تابع أونلاين',
    'attendance.notAttended': 'ما حضرش',
    'attendance.hybrid': 'حضور هجين',
    'attendance.status': 'حالة الحضور',
    'attendance.full': 'حضور كامل',
    'attendance.centerOnly': 'سنتر بس',
    'attendance.onlineOnly': 'أونلاين بس',
    'attendance.absent': 'غايب',
    'attendance.mode': 'نوع الحضور',
    'attendance.filterByMode': 'فلتر حسب نوع الحضور',
    'attendance.all': 'الكل',
    'attendance.save': 'احفظ الحضور',
    'attendance.saving': 'جاري الحفظ...',
    'attendance.legend': 'دليل الحالات',
    'attendance.selectLesson': 'اختار حصة الأول',
    'attendance.recordedFor': 'تم تسجيل حضور',
    'attendance.students': 'طالب',
    'attendance.failedSave': 'مقدرش أحفظ الحضور',

    // ══════════════════════════════════════════════════════════════════════════
    // ATTENDANCE MODES
    // ══════════════════════════════════════════════════════════════════════════
    'mode.online': 'أونلاين',
    'mode.center': 'سنتر',
    'mode.hybrid': 'هجين',
    'mode.change': 'غيّر النوع',
    'mode.changeConfirm': 'متأكد إنك عايز تغير نوع الحضور؟',
    'mode.changeNote': 'ده هيأثر على تسجيل الحضور والتقارير',
    'mode.updated': 'تم تحديث نوع الحضور بنجاح',
    'mode.updateFailed': 'مقدرش أحدث نوع الحضور',

    // ══════════════════════════════════════════════════════════════════════════
    // ROLES
    // ══════════════════════════════════════════════════════════════════════════
    'role.student': 'طالب',
    'role.assistant': 'مدرس مساعد',
    'role.admin': 'الإدارة',

    // ══════════════════════════════════════════════════════════════════════════
    // COURSES
    // ══════════════════════════════════════════════════════════════════════════
    'course': 'كورس',
    'courses': 'كورسات',
    'courses.title': 'الكورسات المميزة',
    'courses.viewAll': 'عرض كل الكورسات',
    'courses.free': 'مجاني',
    'courses.enroll': 'سجل دلوقتي',
    'courses.preview': 'معاينة',
    'courses.manage': 'إدارة الكورسات',
    'courses.add': 'أضف كورس',
    'courses.edit': 'عدل الكورس',
    'courses.delete': 'احذف الكورس',
    'courses.progress': 'تقدم الكورسات',
    'courses.noEnrolled': 'لسه ما اشتركتش في أي كورس',
    'courses.browseAvailable': 'تصفح الكورسات المتاحة وابدأ التعلم',

    // ══════════════════════════════════════════════════════════════════════════
    // STUDENTS
    // ══════════════════════════════════════════════════════════════════════════
    'students': 'الطلاب',
    'students.enrolled': 'الطلاب المشتركين',
    'students.view': 'عرض الطلاب',
    'students.details': 'تفاصيل الطالب',
    'students.noStudents': 'مفيش طلاب',
    'students.noName': 'بدون اسم',
    'students.manage': 'إدارة الطلاب',

    // ══════════════════════════════════════════════════════════════════════════
    // ENROLLMENTS
    // ══════════════════════════════════════════════════════════════════════════
    'enrollments': 'الاشتراكات',
    'enrollments.manage': 'إدارة الاشتراكات',
    'enrollments.pending': 'معلق',
    'enrollments.active': 'نشط',

    // ══════════════════════════════════════════════════════════════════════════
    // REPORTS
    // ══════════════════════════════════════════════════════════════════════════
    'reports': 'التقارير',
    'reports.title': 'التقارير والإحصائيات',
    'reports.overview': 'نظرة شاملة على أداء الطلاب والحضور',
    'reports.avgProgress': 'متوسط التقدم',
    'reports.avgScore': 'متوسط الدرجات',
    'reports.topStudents': 'أفضل الطلاب (حسب درجات الامتحانات)',
    'reports.noResults': 'لسه مفيش نتايج امتحانات',
    'reports.courseStats': 'إحصائيات الكورسات',
    'reports.noCourses': 'لسه مفيش كورسات',
    'reports.studentsByMode': 'الطلاب حسب نوع الحضور',
    'reports.attendanceBreakdown': 'تفاصيل الحضور حسب الحصة',
    'reports.noAttendance': 'لسه مفيش بيانات حضور',
    'reports.attendanceRecords': 'سجلات حضور',
    'reports.attendBoth': 'بيحضروا سنتر وأونلاين',
    'reports.both': 'الاتنين',

    // ══════════════════════════════════════════════════════════════════════════
    // SYSTEM MESSAGES
    // ══════════════════════════════════════════════════════════════════════════
    'system.welcome': 'أهلاً بيك',
    'system.noContent': 'لسه مفيش محتوى',
    'system.allCaughtUp': 'إنت مخلص كل اللي عليك',
    'system.progressSaved': 'تقدمك محفوظ',
    'system.cannotUndo': 'الإجراء ده مينفعش يتلغى',
    'system.groupFixed': 'المجموعة دي ثابتة',
    'system.loading': 'جاري التحميل...',
    'system.error': 'حصل خطأ',
    'system.success': 'تم بنجاح',
    'system.save': 'احفظ',
    'system.cancel': 'إلغاء',
    'system.delete': 'احذف',
    'system.edit': 'عدل',
    'system.add': 'أضف',
    'system.view': 'عرض',
    'system.back': 'رجوع',
    'system.next': 'التالي',
    'system.confirm': 'تأكيد',
    'system.close': 'إغلاق',
    'system.search': 'بحث',
    'system.filter': 'فلتر',
    'system.noData': 'مفيش بيانات',
    'system.viewAll': 'عرض الكل',

    // ══════════════════════════════════════════════════════════════════════════
    // FORMS
    // ══════════════════════════════════════════════════════════════════════════
    'form.title': 'العنوان',
    'form.titleAr': 'العنوان (عربي)',
    'form.description': 'الوصف',
    'form.descriptionAr': 'الوصف (عربي)',
    'form.price': 'السعر',
    'form.grade': 'الصف',
    'form.selectCourse': 'اختار الكورس',
    'form.selectLesson': 'اختار الحصة',
    'form.selectExam': 'اختار الامتحان',
    'form.score': 'الدرجة',
    'form.notes': 'ملاحظات',
    'form.phone': 'رقم التليفون',
    'form.whatsapp': 'رقم الواتساب',
    'form.academicGroup': 'المجموعة الدراسية',

    // ══════════════════════════════════════════════════════════════════════════
    // HERO SECTION
    // ══════════════════════════════════════════════════════════════════════════
    'hero.headline': 'منصتك الكاملة لفهم الكيمياء بشكل حقيقي',
    'hero.subheadline': 'شرح واضح – تطبيق عملي – اختبار ذكي',
    'hero.browseCourses': 'تصفح الكورسات',
    'hero.createAccount': 'إنشاء حساب',
    'hero.badge': 'كيمياء الثانوية العامة',
    'hero.stats.lessons': 'حصة فيديو',
    'hero.stats.students': 'طالب',
    'hero.stats.success': 'نسبة النجاح',

    // ══════════════════════════════════════════════════════════════════════════
    // FEATURES
    // ══════════════════════════════════════════════════════════════════════════
    'features.title': 'ليه المنصة دي؟',
    'features.understanding.title': 'فهم مش حفظ',
    'features.understanding.desc': 'بنركز على بناء فهم عميق للمفاهيم بدل الحفظ الأصم.',
    'features.structured.title': 'شرح خطوة بخطوة',
    'features.structured.desc': 'موضوعات معقدة مقسمة لحصص واضحة وسهلة الفهم.',
    'features.tracking.title': 'متابعة دقيقة للتقدم',
    'features.tracking.desc': 'مراقبة فورية لرحلة تعلمك مع تحليلات مفصلة.',

    // ══════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════════════════════════════════════════
    'footer.contact': 'تواصل معانا',
    'footer.terms': 'شروط الخدمة',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.rights': 'جميع الحقوق محفوظة',
    'footer.legal': 'قانوني',
    'footer.description': 'منصتك الكاملة لفهم الكيمياء بشكل حقيقي. مصممة لطلاب الثانوية العامة.',
    'footer.location': 'القاهرة، مصر',

    // ══════════════════════════════════════════════════════════════════════════
    // ASSISTANT PORTAL
    // ══════════════════════════════════════════════════════════════════════════
    'assistant.portal': 'بوابة المدرسين المساعدين',
    'assistant.dashboard': 'لوحة تحكم المدرس المساعد',
    'assistant.manageCourses': 'إدارة الكورسات',
    'assistant.manageLessons': 'إدارة الحصص',
    'assistant.manageExams': 'إدارة الامتحانات',
    'assistant.recordAttendance': 'سجل الحضور',
    'assistant.recordGrades': 'سجل الدرجات',
    'assistant.viewReports': 'التقارير',

    // ══════════════════════════════════════════════════════════════════════════
    // ABOUT PAGE
    // ══════════════════════════════════════════════════════════════════════════
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
    'about.platform.title': 'إزاي المنصة دي اتولدت؟',
    'about.platform.p1': 'سنة 2020، لما كورونا قلبت الدنيا وكل حاجة اتقفلت، الطلاب فضلوا في البيوت ومحدش عارف يعمل إيه.',
    'about.platform.p2': 'في الوقت ده، حسام فكري قرر إنه ميستناش حد يحل المشكلة.. قال لازم يعمل حاجة بنفسه.',
    'about.platform.p3': 'فبنى المنصة دي عشان الطالب يقدر يتابع حصصه من بيته، من غير ما يضطر يروح سناتر أو يستنى حد.',
    'about.platform.lessons.title': 'حصص كاملة',
    'about.platform.lessons.desc': 'كل الحصص متسجلة ومتاحة في أي وقت، تقدر ترجعلها وتفهمها على مهلك.',
    'about.platform.tracking.title': 'متابعة مستمرة',
    'about.platform.tracking.desc': 'مش بس شرح وخلاص، ده فيه متابعة ليك ولحضورك ودرجاتك.',
    'about.message.title': 'رسالة حسام فكري ليك',
    'about.message.p1': 'الكيمياء مش سهلة.. هي محتاجة شغل وتركيز.',
    'about.message.p2': 'بس لو فهمتها صح من الأول، مش هتحتاج تحفظ حاجة.',
    'about.message.p3': 'حسام فكري هنا عشان يفهمك، مش عشان يحفظك. عشان يخليك تحب المادة، مش تخاف منها.',
    'about.message.cta': 'ولو جاهز تبدأ صح، هو معاك.',

    // ══════════════════════════════════════════════════════════════════════════
    // CAMPAIGNS
    // ══════════════════════════════════════════════════════════════════════════
    'campaigns.followUs': 'تابعنا على فيسبوك',
    'campaigns.title': 'حملاتنا الإعلانية',
    'campaigns.subtitle': 'تابع آخر العروض والأخبار من خلال منشوراتنا على فيسبوك',
    'campaigns.facebookBanner': 'تابعنا على صفحتنا الرسمية على فيسبوك للحصول على آخر التحديثات والعروض',
    'campaigns.note': 'ملاحظة: استبدل روابط المنشورات أعلاه بروابط منشوراتك الفعلية من فيسبوك',
    'campaigns.howToGet': 'يمكنك الحصول على رابط المنشور من خلال الضغط على تاريخ المنشور ونسخ الرابط',
    'campaigns.followTitle': 'تابعنا على فيسبوك',
    'campaigns.followDesc': 'انضم لمجتمعنا على فيسبوك وكن أول من يعرف عن العروض والخصومات الحصرية',
    'campaigns.visitPage': 'زور صفحتنا',
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT TRANSLATION KEYS FOR TYPE SAFETY (optional usage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export type TranslationKey = keyof typeof translations.en;
