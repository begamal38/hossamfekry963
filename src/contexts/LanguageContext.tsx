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
    // DASHBOARD & PROGRESS (renamed to Platform)
    // ══════════════════════════════════════════════════════════════════════════
    'dashboard': 'Platform',
    'dashboard.title': 'Platform',
    'dashboard.student': 'Platform',
    'dashboard.assistant': 'Assistant Platform',
    'dashboard.welcome': 'Welcome',
    'dashboard.yourProgress': 'Your Progress',
    'dashboard.overallProgress': 'Overall Progress',
    'dashboard.lessonsCompleted': 'Sessions Completed',
    'dashboard.lessonsRemaining': 'Sessions Remaining',
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
    // SESSIONS (formerly Lessons)
    // ══════════════════════════════════════════════════════════════════════════
    'lesson': 'Session',
    'lessons': 'Sessions',
    'lesson.start': 'Start Session',
    'lesson.continue': 'Continue Session',
    'lesson.review': 'Review Session',
    'lesson.completed': 'Session Completed',
    'lesson.inProgress': 'Session In Progress',
    'lesson.notStarted': 'Session Not Started',
    'lesson.activity': 'Session Activity',
    'lesson.lastAccessed': 'Last accessed',
    'lesson.noLessons': 'No sessions yet',
    'lesson.manage': 'Manage Sessions',
    'lesson.add': 'Add Session',
    'lesson.edit': 'Edit Session',
    'lesson.delete': 'Delete Session',
    'lesson.title': 'Session Title',
    'lesson.titleAr': 'Session Title (Arabic)',
    'lesson.type': 'Session Type',
    'lesson.online': 'Online Session',
    'lesson.center': 'Center Session',
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
    'hero.title': 'Egypt\'s #1 Chemistry Platform for Thanaweya Amma',
    'hero.subtitle': 'Clear explanation • Practical application • Smart testing',
    'hero.accent': 'Arabic + Languages',
    'hero.cta_courses': 'Browse Courses',
    'hero.cta_signup': 'Create Account',
    'hero.cta_admin': 'Platform Management',
    'hero.cta_platform': 'Enter Platform',
    'hero.stats_lessons': 'Session',
    'hero.stats_students': 'Student',
    'hero.stats_success': 'Success Rate',
    // Legacy keys for backward compatibility
    'hero.headline': 'Welcome to Egypt\'s #1 Chemistry Platform for Thanaweya Amma',
    'hero.subheadline': 'Clear explanation – practical application – smart testing',
    'hero.tracks': 'Arabic + Languages',
    'hero.browseCourses': 'Browse Courses',
    'hero.createAccount': 'Create Account',
    'hero.badge': 'Thanaweya Amma Chemistry',
    'hero.platformManage': 'Platform Management',
    'hero.enterPlatform': 'Enter Platform',
    'hero.teacherAlt': 'Hossam Fekry - Chemistry Teacher',
    'hero.stats.lessons': 'Video Lessons',
    'hero.stats.students': 'Students',
    'hero.stats.success': 'Success Rate',
    'hero.startLearning': 'Start Learning',

    // ══════════════════════════════════════════════════════════════════════════
    // NAV EXTRAS
    // ══════════════════════════════════════════════════════════════════════════
    'nav.platform': 'Platform',
    'nav.myProfile': 'My Profile',
    'nav.assistantPlatform': 'Assistant Platform',

    // ══════════════════════════════════════════════════════════════════════════
    // STUDENT DASHBOARD EXTRAS
    // ══════════════════════════════════════════════════════════════════════════
    'dashboard.welcomeMessage': 'Welcome',
    'dashboard.startWithCourse': 'Start with a course for your level',
    'dashboard.chooseFirstCourse': 'Choose your first course and start learning with us',
    'dashboard.progressExcellent': 'Excellent! You completed everything',
    'dashboard.progressAlmostDone': 'Almost there! Just a little more to finish the course',
    'dashboard.progressKeepGoing': 'Keep going! You are making great progress',
    'dashboard.progressJustStarted': 'Good start! Continue to build momentum',

    // ══════════════════════════════════════════════════════════════════════════
    // ASSISTANT DASHBOARD EXTRAS
    // ══════════════════════════════════════════════════════════════════════════
    'assistant.totalStudents': 'Total Students',
    'assistant.totalLessons': 'Total Lessons',
    'assistant.activeEnrollments': 'Active Enrollments',
    'assistant.avgExamScore': 'Avg Exam Score',
    'assistant.quickActions': 'Quick Actions',
    'assistant.advancedActions': 'Advanced Actions',
    'assistant.students': 'Students',
    'assistant.courses': 'Courses',
    'assistant.lessons': 'Lessons',
    'assistant.addLesson': 'Add Lesson',
    'assistant.sendNotifications': 'Send Notifications',
    'assistant.content': 'Content',
    'assistant.chapters': 'Chapters',
    'assistant.exams': 'Exams',
    'assistant.studentList': 'Student List',
    'assistant.enrollments': 'Enrollments',
    'assistant.analytics': 'Analytics',
    'assistant.reports': 'Reports',
    'assistant.center': 'Center',
    'assistant.groups': 'Groups',
    'assistant.sessions': 'Sessions',
    'assistant.attendance': 'Attendance',
    'assistant.platformSubtitle': 'Platform – Assistant Teacher',

    // ══════════════════════════════════════════════════════════════════════════
    // COURSE/LESSON EXTRAS  
    // ══════════════════════════════════════════════════════════════════════════
    'course.subscribeToUnlock': 'Subscribe to the course to unlock content and start learning',
    'course.comingSoon': 'Coming Soon',
    'lesson.markCompleted': 'Mark Lesson as Completed',
    'lesson.startExam': 'Start Exam',
    'lesson.nextLesson': 'Next Lesson',
    'lesson.watchProgress': 'Complete 20 minutes to count your progress',

    // ══════════════════════════════════════════════════════════════════════════
    // EXAM EXTRAS
    // ══════════════════════════════════════════════════════════════════════════
    'exam.instructions': 'Exam Instructions',
    'exam.questionsCount': 'Questions',
    'exam.timeLimit': 'Time Limit',
    'exam.minutes': 'minutes',
    'exam.rules': 'Read each question carefully before answering',
    'exam.submit': 'Submit Exam',
    'exam.resultPassed': 'Congratulations! You passed the exam',
    'exam.resultFailed': 'You can try again to improve your score',
    'exam.retake': 'Retake Exam',
    'exam.continueToNext': 'Continue to Next',

    // ══════════════════════════════════════════════════════════════════════════
    // FEATURES
    // ══════════════════════════════════════════════════════════════════════════
    'features.title': 'Why Hossam Fekry Platform is Different?',
    'features.understanding.title': 'Real Understanding... Not Memorization',
    'features.understanding.desc': 'We don\'t just memorize formulas, we understand the concept and apply it to any question.',
    'features.structured.title': 'Thanaweya-Worthy Explanation',
    'features.structured.desc': 'The curriculum is smartly divided, and every concept gets its natural time without cramming.',
    'features.languages.title': 'Arabic & Languages with Equal Quality',
    'features.languages.desc': 'Professional explanation for both Arabic and Languages track students with the same depth and care.',
    'features.tracking.title': 'Real Progress Tracking',
    'features.tracking.desc': 'Know exactly where you stand, what you finished, and what\'s left... without complications.',

    // ══════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════════════════════════════════════════
    'footer.contact': 'Contact',
    'footer.followUs': 'Follow Us',
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
    'nav.dashboard': 'المنصة',
    'nav.signUp': 'إنشاء حساب',
    'nav.login': 'تسجيل الدخول',
    'nav.logout': 'تسجيل الخروج',
    'nav.campaigns': 'حملاتنا الإعلانية',
    'nav.about': 'عن حسام فكري',
    'nav.settings': 'الإعدادات',
    'nav.controlPanel': 'المنصة',

    // ══════════════════════════════════════════════════════════════════════════
    // DASHBOARD & PROGRESS (renamed to المنصة)
    // ══════════════════════════════════════════════════════════════════════════
    'dashboard': 'المنصة',
    'dashboard.title': 'المنصة',
    'dashboard.student': 'المنصة',
    'dashboard.assistant': 'منصة المدرس المساعد',
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
    'hero.title': 'المنصة رقم 1 في مصر لتعليم الكيمياء لطلاب الثانوية العامة',
    'hero.subtitle': 'شرح واضح • تطبيق عملي • اختبارات ذكية',
    'hero.accent': 'عربي + لغات',
    'hero.cta_courses': 'تصفح الكورسات',
    'hero.cta_signup': 'إنشاء حساب',
    'hero.cta_admin': 'إدارة المنصة',
    'hero.cta_platform': 'دخول المنصة',
    'hero.stats_lessons': 'حصة',
    'hero.stats_students': 'طالب',
    'hero.stats_success': 'نسبة النجاح',
    // Legacy keys for backward compatibility
    'hero.headline': 'أهلاً بيك أيها الطالب في المنصة رقم 1 في مصر لتعليم الكيمياء للثانوية العامة',
    'hero.subheadline': 'شرح واضح – تطبيق عملي – اختبارات ذكية',
    'hero.tracks': 'عربي + لغات',
    'hero.browseCourses': 'تصفح الكورسات',
    'hero.createAccount': 'إنشاء حساب',
    'hero.badge': 'كيمياء الثانوية العامة',
    'hero.platformManage': 'إدارة المنصة',
    'hero.enterPlatform': 'الدخول إلى المنصة',
    'hero.teacherAlt': 'حسام فكري - مدرس الكيمياء',
    'hero.stats.lessons': 'فيديو تعليمي',
    'hero.stats.students': 'طالب',
    'hero.stats.success': 'نسبة نجاح',
    'hero.startLearning': 'ابدأ التعلم',

    // ══════════════════════════════════════════════════════════════════════════
    // NAV EXTRAS
    // ══════════════════════════════════════════════════════════════════════════
    'nav.platform': 'المنصة',
    'nav.myProfile': 'ملفي',
    'nav.assistantPlatform': 'منصة المدرس المساعد',

    // ══════════════════════════════════════════════════════════════════════════
    // STUDENT DASHBOARD EXTRAS
    // ══════════════════════════════════════════════════════════════════════════
    'dashboard.welcomeMessage': 'أهلاً بيك',
    'dashboard.startWithCourse': 'ابدأ بكورس مناسب لمرحلتك',
    'dashboard.chooseFirstCourse': 'اختر كورسك الأول وابدأ رحلة التعلم معانا',
    'dashboard.progressExcellent': 'ممتاز 👏 خلصت كل حاجة',
    'dashboard.progressAlmostDone': 'قربت تخلص! كمان شوية بس',
    'dashboard.progressKeepGoing': 'شغل ممتاز! كمل كده',
    'dashboard.progressJustStarted': 'بداية حلوة! كمل عشان تكسب الزخم',

    // ══════════════════════════════════════════════════════════════════════════
    // ASSISTANT DASHBOARD EXTRAS
    // ══════════════════════════════════════════════════════════════════════════
    'assistant.totalStudents': 'إجمالي الطلاب',
    'assistant.totalLessons': 'إجمالي الحصص',
    'assistant.activeEnrollments': 'الاشتراكات النشطة',
    'assistant.avgExamScore': 'متوسط درجات الامتحانات',
    'assistant.quickActions': 'إجراءات سريعة',
    'assistant.advancedActions': 'إجراءات متقدمة',
    'assistant.students': 'الطلاب',
    'assistant.courses': 'الكورسات',
    'assistant.lessons': 'الحصص',
    'assistant.addLesson': 'إضافة حصة',
    'assistant.sendNotifications': 'إرسال إشعارات',
    'assistant.content': 'المحتوى',
    'assistant.chapters': 'الأبواب',
    'assistant.exams': 'الامتحانات',
    'assistant.studentList': 'قائمة الطلاب',
    'assistant.enrollments': 'الاشتراكات',
    'assistant.analytics': 'التحليلات',
    'assistant.reports': 'التقارير',
    'assistant.center': 'السنتر',
    'assistant.groups': 'المجموعات',
    'assistant.sessions': 'الجلسات',
    'assistant.attendance': 'الحضور',
    'assistant.platformSubtitle': 'المنصة – المدرس المساعد',

    // ══════════════════════════════════════════════════════════════════════════
    // COURSE/LESSON EXTRAS  
    // ══════════════════════════════════════════════════════════════════════════
    'course.subscribeToUnlock': 'اشترك في الكورس لفتح المحتوى والبدء في التعلم',
    'course.comingSoon': 'قريباً',
    'lesson.markCompleted': 'خلصت الحصة',
    'lesson.startExam': 'ابدأ الامتحان',
    'lesson.nextLesson': 'انتقل للحصة التالية',
    'lesson.watchProgress': 'كمّل 20 دقيقة عشان يتحسب التقدم',

    // ══════════════════════════════════════════════════════════════════════════
    // EXAM EXTRAS
    // ══════════════════════════════════════════════════════════════════════════
    'exam.instructions': 'تعليمات الاختبار',
    'exam.questionsCount': 'عدد الأسئلة',
    'exam.timeLimit': 'الوقت المحدد',
    'exam.minutes': 'دقيقة',
    'exam.rules': 'اقرأ كل سؤال بعناية قبل الإجابة',
    'exam.submit': 'تسليم الامتحان',
    'exam.resultPassed': 'مبروك! اجتزت الامتحان بنجاح',
    'exam.resultFailed': 'ممكن تحاول تاني عشان تحسن درجتك',
    'exam.retake': 'إعادة الامتحان',
    'exam.continueToNext': 'انتقل للتالي',

    // ══════════════════════════════════════════════════════════════════════════
    // FEATURES
    // ══════════════════════════════════════════════════════════════════════════
    'features.title': 'ليه منصة حسام فكري مختلفة؟',
    'features.understanding.title': 'فهم بجد… مش حفظ',
    'features.understanding.desc': 'مش بنحفظ قوانين وخلاص، إحنا بنفهم الفكرة ونعرف نستخدمها في أي سؤال.',
    'features.structured.title': 'شرح يليق بثانوية عامة',
    'features.structured.desc': 'المنهج متقسم بذكاء، وكل فكرة ليها وقتها الطبيعي من غير تكديس.',
    'features.languages.title': 'لغات وعربي بنفس القوة',
    'features.languages.desc': 'شرح احترافي لطلاب العربي واللغات بنفس العمق ونفس الاهتمام.',
    'features.tracking.title': 'متابعة حقيقية لتقدمك',
    'features.tracking.desc': 'عارف أنت واقف فين، خلصت إيه، ولسه فاضلك إيه… من غير تعقيد.',

    // ══════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════════════════════════════════════════
    'footer.contact': 'تواصل معانا',
    'footer.followUs': 'تابعنا',
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
    } else {
      setLanguage('en');
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
