import { Link } from "react-router-dom";
import {
  GraduationCap,
  Presentation,
  BookOpen,
  ArrowRight,
  Users,
  Brain,
  Upload,
} from "lucide-react";

function RoleSelection() {
  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">

      {/* Background */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute right-10 top-1/3 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>


      {/* Content */}

      <main className="relative flex min-h-screen items-center justify-center px-6 py-16">

        <div className="w-full max-w-5xl">

          {/* Logo */}
          <Link to="/" className="group mb-10 flex items-center justify-center gap-3">
            <div className="orbit-ring flex size-10 items-center justify-center">
              <img src="/logo.png" alt="StudySphere" className="size-10 object-contain transition-transform duration-500 group-hover:scale-110" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Study<span className="text-gradient">Sphere</span>
            </span>
          </Link>

          {/* Heading */}

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              Welcome to StudySphere
            </p>

            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              How are you joining StudySphere?
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Choose your role to get the experience designed specifically
              for how you want to learn or teach.
            </p>

          </div>


          {/* Role Cards */}

          <div className="mt-14 grid gap-6 md:grid-cols-2">

            {/* =================================================
                STUDENT
            ================================================= */}

            <Link
              to="/signup/student"
              className="role-select-card stagger-in stagger-1 group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-8 transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/40 hover:bg-slate-900"
            >

              {/* Glow */}

              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />


              {/* Icon */}

              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <GraduationCap
                  size={28}
                  strokeWidth={1.7}
                />
              </div>


              {/* Text */}

              <div className="relative mt-7">

                <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                  Student
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Learn. Focus. Grow.
                </h2>

                <p className="mt-4 leading-7 text-slate-400">
                  Build better study habits, learn from courses,
                  get help from AI Mentor, and track your progress.
                </p>

              </div>


              {/* Features */}

              <div className="relative mt-8 grid grid-cols-2 gap-3">

                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  <Brain size={17} className="text-blue-400" />
                  AI Mentor
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  <BookOpen size={17} className="text-blue-400" />
                  Learn Courses
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  <Users size={17} className="text-blue-400" />
                  Community
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  <BookOpen size={17} className="text-blue-400" />
                  Track Progress
                </div>

              </div>


              {/* CTA */}

              <div className="relative mt-9 flex items-center font-semibold text-blue-400">

                Continue as Student

                <ArrowRight
                  size={18}
                  className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
                />

              </div>

            </Link>


            {/* =================================================
                TEACHER
            ================================================= */}

            <Link
              to="/signup/teacher"
              className="role-select-card stagger-in stagger-2 group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-8 transition-all duration-500 hover:-translate-y-2 hover:border-purple-500/40 hover:bg-slate-900"
            >

              {/* Glow */}

              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-purple-600/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />


              {/* Icon */}

              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                <Presentation
                  size={28}
                  strokeWidth={1.7}
                />
              </div>


              {/* Text */}

              <div className="relative mt-7">

                <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">
                  Teacher
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  Create. Teach. Inspire.
                </h2>

                <p className="mt-4 leading-7 text-slate-400">
                  Create courses, upload learning materials,
                  manage your content, and help students grow.
                </p>

              </div>


              {/* Features */}

              <div className="relative mt-8 grid grid-cols-2 gap-3">

                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  <BookOpen size={17} className="text-purple-400" />
                  Create Courses
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  <Upload size={17} className="text-purple-400" />
                  Upload Content
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  <Users size={17} className="text-purple-400" />
                  Manage Students
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                  <Brain size={17} className="text-purple-400" />
                  AI Tools
                </div>

              </div>


              {/* CTA */}

              <div className="relative mt-9 flex items-center font-semibold text-purple-400">

                Continue as Teacher

                <ArrowRight
                  size={18}
                  className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
                />

              </div>

            </Link>

          </div>


          {/* Login */}

          <p className="mt-10 text-center text-sm text-slate-500">

            Already have an account?

            <Link
              to="/login"
              className="ml-2 font-medium text-slate-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>

          </p>

        </div>

      </main>

    </div>
  );
}

export default RoleSelection;