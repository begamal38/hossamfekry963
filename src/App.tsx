import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireResolvedAccess } from "@/components/routing/RequireResolvedAccess";
import { ScrollToTop } from "@/components/routing/ScrollToTop";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { SessionProtectionProvider } from "@/components/session/SessionProtectionProvider";
import { SystemFeedbackProvider } from "@/components/ui/SystemFeedback";
import GovernorateCheck from "@/components/profile/GovernorateCheck";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AppLaunchAnimation } from "@/components/launch/AppLaunchAnimation";
import { useLaunchAnimation } from "@/hooks/useLaunchAnimation";
import Index from "./pages/Index";

// Lazy load all pages except Index for better initial bundle size
const AssistantTransition = lazy(() => import("./pages/AssistantTransition"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseView = lazy(() => import("./pages/CourseView"));
const LessonView = lazy(() => import("./pages/LessonView"));
const FreeLessons = lazy(() => import("./pages/FreeLessons"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const Payment = lazy(() => import("./pages/Payment"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const About = lazy(() => import("./pages/About"));
const Notifications = lazy(() => import("./pages/Notifications"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const Install = lazy(() => import("./pages/Install"));
const TakeExam = lazy(() => import("./pages/TakeExam"));

// Assistant pages
const AssistantDashboard = lazy(() => import("./pages/assistant/AssistantDashboard"));
const Students = lazy(() => import("./pages/assistant/Students"));
const StudentDetails = lazy(() => import("./pages/assistant/StudentDetails"));
const Enrollments = lazy(() => import("./pages/assistant/Enrollments"));
const ManageLessons = lazy(() => import("./pages/assistant/ManageLessons"));
const ManageChapters = lazy(() => import("./pages/assistant/ManageChapters"));
const RecordAttendance = lazy(() => import("./pages/assistant/RecordAttendance"));
const Reports = lazy(() => import("./pages/assistant/Reports"));
const ManageCourses = lazy(() => import("./pages/assistant/ManageCourses"));
const SendNotifications = lazy(() => import("./pages/assistant/SendNotifications"));
const CenterGroups = lazy(() => import("./pages/assistant/CenterGroups"));
const CenterSessions = lazy(() => import("./pages/assistant/CenterSessions"));
const ManageExams = lazy(() => import("./pages/assistant/ManageExams"));
const ExamResults = lazy(() => import("./pages/assistant/ExamResults"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Inner app content component
const AppContent = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <SessionProtectionProvider>
            <GovernorateCheck>
              <TooltipProvider>
                <SystemFeedbackProvider>
                <Toaster />
                <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/assistant-transition" element={<AssistantTransition />} />
                  {/* Student platform - accessible via /platform or legacy /dashboard */}
                  <Route
                    path="/platform"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ hasRole }) => hasRole("student")}
                      >
                        <Dashboard />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ hasRole }) => hasRole("student")}
                      >
                        <Dashboard />
                      </RequireResolvedAccess>
                    }
                  />
                  {/* Public course browsing - no auth required */}
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/course/:courseId" element={<CourseView />} />
                  <Route path="/course/:courseId/lessons" element={<CourseView />} />
                  
                  {/* Lesson view - free lessons accessible without auth */}
                  <Route path="/lesson/:lessonId" element={<LessonView />} />

                  {/* Public routes */}
                  <Route path="/free-lessons" element={<FreeLessons />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/install" element={<Install />} />

                  <Route
                    path="/settings"
                    element={
                      <RequireResolvedAccess requireAuth>
                        <Settings />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <RequireResolvedAccess requireAuth>
                        <Notifications />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ hasRole }) => hasRole("student")}
                      >
                        <StudentProfile />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/payment/:courseId"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ hasRole }) => hasRole("student")}
                      >
                        <Payment />
                      </RequireResolvedAccess>
                    }
                  />
                  {/* Assistant Teacher Routes */}
                  <Route
                    path="/assistant"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <AssistantDashboard />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/students"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <Students />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/students/:studentId"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <StudentDetails />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/enrollments"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <Enrollments />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/courses"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <ManageCourses />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/chapters"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <ManageChapters />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/lessons"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <ManageLessons />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/attendance"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <RecordAttendance />
                      </RequireResolvedAccess>
                    }
                  />
                  {/* /assistant/grades route removed - grades come ONLY from exams */}
                  <Route
                    path="/assistant/reports"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <Reports />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/notifications"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <SendNotifications />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/center-groups"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <CenterGroups />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/center-sessions"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                      <CenterSessions />
                    </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/exams"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <ManageExams />
                      </RequireResolvedAccess>
                    }
                  />
                  <Route
                    path="/assistant/exam-results/:examId"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <ExamResults />
                      </RequireResolvedAccess>
                    }
                  />
                  {/* Student exam route */}
                  <Route
                    path="/exam/:examId"
                    element={
                      <RequireResolvedAccess requireAuth>
                        <TakeExam />
                      </RequireResolvedAccess>
                    }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
                {/* Mobile Bottom Navigation - visible only on mobile */}
                <MobileBottomNav />
              </BrowserRouter>
              </SystemFeedbackProvider>
              </TooltipProvider>
            </GovernorateCheck>
          </SessionProtectionProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

// Main App component with launch animation
const App = () => {
  const { showAnimation, handleAnimationComplete } = useLaunchAnimation();

  return (
    <>
      {showAnimation && (
        <AppLaunchAnimation onComplete={handleAnimationComplete} />
      )}
      <AppContent />
    </>
  );
};

export default App;
