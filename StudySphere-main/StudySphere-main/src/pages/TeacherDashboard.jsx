import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Upload,
  BarChart3,
  Brain,
  Plus,
  ArrowRight,
  Clock3,
  Eye,
  GraduationCap,
  ClipboardList,
} from "lucide-react";

import TeacherNavbar from "../components/teacher/TeacherNavbar";
import ReviewAssignmentsDrawer from "../components/teacher/ReviewAssignmentsDrawer";
import { useAuth } from "../context/AuthContext";
import { courseApi } from "../lib/api";

function TeacherDashboard() {
  const { user } = useAuth();

  const [savedCourses, setSavedCourses] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    courseApi
      .myCourses()
      .then((data) => {
        if (!cancelled) setSavedCourses(data.courses || []);
      })
      .catch(() => {
        if (!cancelled) setSavedCourses([]);
      });

    courseApi
      .allStudents()
      .then((data) => {
        if (!cancelled) setStudentsList(data.students || []);
      })
      .catch(() => {
        if (!cancelled) setStudentsList([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const publishedCourses = savedCourses;

  const totalStudents = savedCourses.reduce(
    (total, course) => total + (course.enrolledCount || 0),
    0
  );

  const totalLessons = savedCourses.reduce(
    (total, course) =>
      total + (course.lessons?.length || 0),
    0
  );

  const pendingSubmissionsCount = studentsList.reduce((count, student) => {
    const pending = (student.submissions || []).filter(
      (s) => s.status === "submitted"
    ).length;
    return count + pending;
  }, 0);

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          TEACHER NAVBAR & REVIEW DRAWER
      ===================================================== */}

      <TeacherNavbar />
      <ReviewAssignmentsDrawer
        open={reviewDrawerOpen}
        onClose={() => setReviewDrawerOpen(false)}
      />


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-24">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

          <div>

            <p className="text-sm font-medium text-purple-400">
              TEACHER DASHBOARD
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Welcome back 👋
            </h1>

            <p className="mt-3 text-slate-400">
              Create, teach, manage, and inspire your learners.
            </p>

          </div>


          <Link
            to="/teacher/create-course"
            className="hero-button inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-purple-600/25 transition-all duration-300 hover:brightness-110"
          >
            <Plus size={18} />
            Create Course
          </Link>

        </div>


        {/* =================================================
            STATS
        ================================================= */}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Courses */}

          <div className="dashboard-card stagger-in stagger-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Published Courses
              </p>

              <BookOpen
                size={20}
                className="text-purple-400"
              />

            </div>

            <p className="mt-4 text-3xl font-bold">
              {publishedCourses.length}
            </p>

            <p className="mt-2 text-sm text-purple-400">
              Your active courses
            </p>

          </div>


          {/* Students */}

          <div className="dashboard-card stagger-in stagger-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Students
              </p>

              <Users
                size={20}
                className="text-blue-400"
              />

            </div>

            <p className="mt-4 text-3xl font-bold">
              {totalStudents}
            </p>

            <p className="mt-2 text-sm text-blue-400">
              Across your courses
            </p>

          </div>


          {/* Lessons */}

          <div className="dashboard-card stagger-in stagger-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Total Lessons
              </p>

              <GraduationCap
                size={20}
                className="text-emerald-400"
              />

            </div>

            <p className="mt-4 text-3xl font-bold">
              {totalLessons}
            </p>

            <p className="mt-2 text-sm text-emerald-400">
              Video lessons
            </p>

          </div>


          {/* Review Assignments Card */}

          <button
            type="button"
            onClick={() => setReviewDrawerOpen(true)}
            className="dashboard-card stagger-in stagger-4 text-left rounded-2xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition p-5"
          >

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-purple-400">
                Review Assignments
              </p>

              <ClipboardList
                size={20}
                className="text-purple-400"
              />

            </div>

            <p className="mt-4 text-3xl font-bold text-white">
              {pendingSubmissionsCount}
            </p>

            <p className="mt-2 text-xs font-medium text-purple-400">
              {pendingSubmissionsCount > 0
                ? `${pendingSubmissionsCount} pending review →`
                : "Click to review submissions →"}
            </p>

          </button>

        </div>


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* =================================================
              COURSES
          ================================================= */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-2">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  YOUR CONTENT
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Recent Courses
                </h2>

              </div>

              <Link
                to="/teacher/courses"
                className="link-underline text-sm text-purple-400 hover:text-purple-300"
              >
                Manage All →
              </Link>

            </div>


            <div className="mt-7 space-y-4">

              {savedCourses.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center">

                  <BookOpen
                    size={32}
                    className="mx-auto text-slate-700"
                  />

                  <h3 className="mt-4 font-semibold">
                    No courses yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Create your first course and add your
                    YouTube lectures.
                  </p>

                  <Link
                    to="/teacher/create-course"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-purple-600/20 transition hover:brightness-110"
                  >
                    <Plus size={16} />
                    Create Course
                  </Link>

                </div>

              ) : (

                savedCourses
                  .slice(-4)
                  .reverse()
                  .map((course) => (

                    <div
                      key={course.id}
                      className="dashboard-card flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4"
                    >

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                        <BookOpen size={22} />
                      </div>


                      <div className="min-w-0 flex-1">

                        <h3 className="truncate font-semibold">
                          {course.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {course.lessons?.length || 0} lessons
                        </p>

                      </div>


                      <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 sm:block">
                        Published
                      </span>

                    </div>

                  ))

              )}

            </div>

          </div>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

            <p className="text-sm text-slate-500">
              QUICK ACTIONS
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Manage your teaching
            </h2>


            <div className="mt-7 space-y-3">

              <Link
                to="/teacher/create-course"
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 transition-all duration-300 hover:border-purple-500/30 hover:bg-slate-900"
              >

                <Upload
                  size={19}
                  className="text-purple-400"
                />

                <span className="flex-1 text-sm font-medium">
                  Create & Upload Course
                </span>

                <ArrowRight size={17} />

              </Link>


              <Link
                to="/teacher/courses"
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 transition-all duration-300 hover:border-purple-500/30 hover:bg-slate-900"
              >

                <BookOpen
                  size={19}
                  className="text-blue-400"
                />

                <span className="flex-1 text-sm font-medium">
                  Manage Courses
                </span>

                <ArrowRight size={17} />

              </Link>


              <Link
                to="/teacher/students"
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 transition-all duration-300 hover:border-purple-500/30 hover:bg-slate-900"
              >

                <Users
                  size={19}
                  className="text-emerald-400"
                />

                <span className="flex-1 text-sm font-medium">
                  View Students
                </span>

                <ArrowRight size={17} />

              </Link>

            </div>

          </div>

        </div>


        {/* =================================================
            LOWER FEATURES
        ================================================= */}

        <div className="mt-6 grid gap-6 md:grid-cols-3">

          {/* AI */}

          <div className="rounded-3xl border border-indigo-500/20 bg-slate-900/70 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Brain size={22} />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              AI Mentor
            </h3>

            <p className="mt-3 leading-7 text-slate-400">
              Use AI assistance to explain concepts,
              plan lessons, and support your teaching workflow.
            </p>

            <Link
              to="/ai-mentor"
              className="mt-7 inline-flex items-center text-indigo-400"
            >
              Explore AI Mentor
              <ArrowRight size={17} className="ml-2" />
            </Link>

          </div>


          {/* Analytics */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <BarChart3 size={22} />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Teaching Analytics
            </h3>

            <p className="mt-3 leading-7 text-slate-400">
              Understand course engagement, student activity,
              and how your content is performing.
            </p>

            <Link
              to="/teacher/analytics"
              className="mt-7 inline-flex items-center text-blue-400"
            >
              View Analytics
              <ArrowRight size={17} className="ml-2" />
            </Link>

          </div>


          {/* Community */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users size={22} />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Community
            </h3>

            <p className="mt-3 leading-7 text-slate-400">
              Connect with learners and other teachers,
              share knowledge, and build discussions.
            </p>

            <Link
              to="/community"
              className="mt-7 inline-flex items-center text-emerald-400"
            >
              Explore Community
              <ArrowRight size={17} className="ml-2" />
            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}

export default TeacherDashboard;