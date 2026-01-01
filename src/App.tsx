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
import GovernorateCheck from "@/components/profile/GovernorateCheck";
import Index from "./pages/Index";
import AssistantTransition from "./pages/AssistantTransition";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseView from "./pages/CourseView";
import LessonView from "./pages/LessonView";
import FreeLessons from "./pages/FreeLessons";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Payment from "./pages/Payment";
import NotFound from "./pages/NotFound";
import Campaigns from "./pages/Campaigns";
import About from "./pages/About";
import Notifications from "./pages/Notifications";
import StudentProfile from "./pages/StudentProfile";
import Install from "./pages/Install";
import AssistantDashboard from "./pages/assistant/AssistantDashboard";
import Students from "./pages/assistant/Students";
import StudentDetails from "./pages/assistant/StudentDetails";
import Enrollments from "./pages/assistant/Enrollments";
import ManageLessons from "./pages/assistant/ManageLessons";
import ManageChapters from "./pages/assistant/ManageChapters";
import RecordAttendance from "./pages/assistant/RecordAttendance";
import RecordGrades from "./pages/assistant/RecordGrades";
import Reports from "./pages/assistant/Reports";
import ManageCourses from "./pages/assistant/ManageCourses";
import SendNotifications from "./pages/assistant/SendNotifications";
import CenterGroups from "./pages/assistant/CenterGroups";
import CenterSessions from "./pages/assistant/CenterSessions";
import ManageExams from "./pages/assistant/ManageExams";
import TakeExam from "./pages/TakeExam";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <SessionProtectionProvider>
            <GovernorateCheck>
              <TooltipProvider>
                <Toaster />
                <Sonner />
              <BrowserRouter>
                <ScrollToTop />
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
                    path="/assistant/students/:userId"
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
                  <Route
                    path="/assistant/grades"
                    element={
                      <RequireResolvedAccess
                        requireAuth
                        allow={({ canAccessDashboard }) => canAccessDashboard()}
                      >
                        <RecordGrades />
                      </RequireResolvedAccess>
                    }
                  />
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
              </BrowserRouter>
              </TooltipProvider>
            </GovernorateCheck>
          </SessionProtectionProvider>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
