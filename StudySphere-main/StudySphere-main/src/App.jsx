import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardShell from "./components/dashboard/DashboardShell";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import ExploreCourseDetails from "./pages/ExploreCourseDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Community from "./pages/Community";
import Focus from "./pages/Focus";
import AIMentor from "./pages/AIMentor";
import Organize from "./pages/Organize";
import Platforms from "./pages/Platforms";
import Progress from "./pages/Progress";
import TeacherSignup from "./pages/TeacherSignup";
import RoleSelection from "./pages/RoleSelection";
import ComingSoon from "./pages/ComingSoon";

import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";

import StudentProfile from "./pages/StudentProfile";
import StudentCourses from "./pages/StudentCourses";
import CourseDetails from "./pages/CourseDetails";
import Lesson from "./pages/Lesson";

import CreateCourse from "./pages/CreateCourse";
import TeacherCourses from "./pages/TeacherCourses";
import ManageCourse from "./pages/ManageCourse";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherCourseStudents from "./pages/TeacherCourseStudents";
import TeacherProfile from "./pages/TeacherProfile";
import PostDetail from "./pages/PostDetail";
import Messages from "./pages/Messages";
import { FocusProvider } from "./context/FocusContext";
import FocusWidget from "./components/focus/FocusWidget";

function App() {
  return (
    <FocusProvider>
      <FocusWidget />
      <Routes>

      {/* =========================
          PUBLIC PAGES
      ========================= */}

      <Route
        path="/"
        element={
          <>
            <Navbar />

            <main className="pt-16">
              <Home />
            </main>

            <Footer />
          </>
        }
      />

      <Route
        path="/explore"
        element={
          <>
            <Navbar />

            <main className="pt-16">
              <Explore />
            </main>

            <Footer />
          </>
        }
      />

      <Route
        path="/explore/:courseId"
        element={
          <>
            <Navbar />

            <main className="pt-16">
              <ExploreCourseDetails />
            </main>

            <Footer />
          </>
        }
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      <Route
        path="/signup"
        element={<RoleSelection />}
      />

      <Route
        path="/signup/student"
        element={<Signup />}
      />

      <Route
        path="/signup/teacher"
        element={<TeacherSignup />}
      />

      {/* =========================
          THESE PAGES REQUIRE LOGIN
          (any role — student or teacher)
      ========================= */}

      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <Community />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/community/post/:postId"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <PostDetail />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teachers/:teacherId"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <TeacherProfile />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <Messages />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-mentor"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <AIMentor />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organize"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <Organize />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/platforms"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <Platforms />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <DashboardShell>
              <Progress />
            </DashboardShell>
          </ProtectedRoute>
        }
      />


      {/* =========================
          STUDENT PAGES
      ========================= */}

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/profile"
        element={
          <ProtectedRoute role="student">
            <StudentProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/courses"
        element={
          <ProtectedRoute role="student">
            <DashboardShell>
              <StudentCourses />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/settings"
        element={
          <ProtectedRoute role="student">
            <ComingSoon title="Settings" backTo="/student/dashboard" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/notifications"
        element={
          <ProtectedRoute role="student">
            <ComingSoon title="Notifications" backTo="/student/dashboard" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/courses/:courseId"
        element={
          <ProtectedRoute role="student">
            <CourseDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/courses/:courseId/lesson/:lessonId"
        element={
          <ProtectedRoute role="student">
            <Lesson />
          </ProtectedRoute>
        }
      />


      {/* =========================
          TEACHER PAGES
      ========================= */}

      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute role="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/create-course"
        element={
          <ProtectedRoute role="teacher">
            <CreateCourse />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/courses"
        element={
          <ProtectedRoute role="teacher">
            <TeacherCourses />
          </ProtectedRoute>
        }
      />


      <Route
        path="/teacher/courses/:courseId/manage"
        element={
          <ProtectedRoute role="teacher">
            <ManageCourse />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute role="teacher">
            <TeacherStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/courses/:courseId/students"
        element={
          <ProtectedRoute role="teacher">
            <TeacherCourseStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/profile"
        element={
          <ProtectedRoute role="teacher">
            <TeacherProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/settings"
        element={
          <ProtectedRoute role="teacher">
            <ComingSoon title="Settings" backTo="/teacher/dashboard" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/notifications"
        element={
          <ProtectedRoute role="teacher">
            <ComingSoon title="Notifications" backTo="/teacher/dashboard" />
          </ProtectedRoute>
        }
      />

      {/* =========================
          MISC (LOGIN REQUIRED)
      ========================= */}

      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <ComingSoon title="Help & Support" backTo="/" />
          </ProtectedRoute>
        }
      />
    </Routes>
  </FocusProvider>
  );
}

export default App;