import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { SessionProtectionProvider } from "@/components/session/SessionProtectionProvider";
import Index from "./pages/Index";
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
import AssistantDashboard from "./pages/assistant/AssistantDashboard";
import Students from "./pages/assistant/Students";
import StudentDetails from "./pages/assistant/StudentDetails";
import Enrollments from "./pages/assistant/Enrollments";
import ManageLessons from "./pages/assistant/ManageLessons";
import RecordAttendance from "./pages/assistant/RecordAttendance";
import RecordGrades from "./pages/assistant/RecordGrades";
import Reports from "./pages/assistant/Reports";
import ManageCourses from "./pages/assistant/ManageCourses";
import SendNotifications from "./pages/assistant/SendNotifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <SessionProtectionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/course/:courseId" element={<CourseView />} />
                <Route path="/course/:courseId/lessons" element={<CourseView />} />
                <Route path="/lesson/:lessonId" element={<LessonView />} />
                <Route path="/free-lessons" element={<FreeLessons />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/about" element={<About />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<StudentProfile />} />
                <Route path="/payment/:courseId" element={<Payment />} />
                {/* Assistant Teacher Routes */}
                <Route path="/assistant" element={<AssistantDashboard />} />
                <Route path="/assistant/students" element={<Students />} />
                <Route path="/assistant/students/:userId" element={<StudentDetails />} />
                <Route path="/assistant/enrollments" element={<Enrollments />} />
                <Route path="/assistant/courses" element={<ManageCourses />} />
                <Route path="/assistant/lessons" element={<ManageLessons />} />
                <Route path="/assistant/attendance" element={<RecordAttendance />} />
                <Route path="/assistant/grades" element={<RecordGrades />} />
                <Route path="/assistant/reports" element={<Reports />} />
                <Route path="/assistant/notifications" element={<SendNotifications />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SessionProtectionProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
