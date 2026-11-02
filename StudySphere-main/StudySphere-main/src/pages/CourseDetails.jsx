import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Lock,
  Play,
  Star,
  Users,
  XCircle,
} from "lucide-react";

import { courseApi, ApiError } from "../lib/api";

function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    courseApi
      .myEnrolledCourse(courseId)
      .then((data) => {
        if (!cancelled) setCourse(data.course);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load this course."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const getGradient = (color) => {
    const gradients = {
      blue: "from-blue-600/30 via-blue-500/10",
      cyan: "from-cyan-600/30 via-cyan-500/10",
      yellow: "from-yellow-600/30 via-yellow-500/10",
      purple: "from-purple-600/30 via-purple-500/10",
      orange: "from-orange-600/30 via-orange-500/10",
      emerald: "from-emerald-600/30 via-emerald-500/10",
      green: "from-green-600/30 via-green-500/10",
      slate: "from-slate-600/30 via-slate-500/10",
    };

    return gradients[color] || gradients.slate;
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <p className="text-sm text-slate-500">Loading course…</p>
      </div>
    );
  }

  /* =====================================================
     NOT FOUND / NOT ENROLLED
  ===================================================== */

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <BookOpen size={40} className="mx-auto text-slate-600" />
          <h1 className="mt-5 text-2xl font-bold">Course not available</h1>
          <p className="mt-2 text-slate-500">
            {error || "The course you are looking for does not exist."}
          </p>
          <Link
            to="/student/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <ArrowLeft size={16} />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const lessonProgress = Array.isArray(course.lessonProgress) ? course.lessonProgress : [];
  const progressById = new Map(lessonProgress.map((p) => [p.lessonId, p]));

  const completedCount = lessonProgress.filter((p) => p.completed).length;
  const progress = course.progressPct ?? (lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0);
  const hasLessons = lessons.length > 0;

  // The lesson the student should jump to next: the first one they
  // haven't marked complete yet.
  const nextLesson =
    lessons.find((lesson) => {
      const p = progressById.get(lesson.id);
      return p && !p.completed;
    }) || lessons[0] || null;

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">
      {/* HEADER / COURSE HERO */}
      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <button
            type="button"
            onClick={() => navigate("/student/courses")}
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Courses
          </button>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                  {course.category}
                </span>
                <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-500">
                  {course.level}
                </span>
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
                {course.title}
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                {course.description}
              </p>

              <p className="mt-5 text-sm text-slate-500">
                Created by{" "}
                <span className="font-medium text-slate-300">{course.instructor}</span>
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-slate-300">{course.rating || "New"}</span>
                  {course.rating > 0 && " rating"}
                </span>

                <span className="flex items-center gap-2">
                  <Users size={16} />
                  {course.enrolledCount || 0} students
                </span>

                <span className="flex items-center gap-2">
                  <Clock3 size={16} />
                  {lessons.length} lessons
                </span>
              </div>
            </div>

            <div
              className={`relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br ${getGradient(course.color)} to-slate-950`}
            >
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt=""
                  className="absolute inset-0 h-48 w-full object-cover opacity-40"
                />
              )}
              <div className="relative flex h-48 items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/60 text-white/80 backdrop-blur">
                  <BookOpen size={38} strokeWidth={1.5} />
                </div>
              </div>

              <div className="border-t border-white/5 bg-slate-950/50 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Course Progress</span>
                  <span className="font-semibold text-blue-400">{progress}%</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {hasLessons ? (
                  <Link
                    to={`/student/courses/${courseId}/lesson/${nextLesson.id}`}
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    <Play size={17} />
                    {progress > 0 ? "Continue Learning" : "Start Course"}
                  </Link>
                ) : (
                  <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-center text-sm text-slate-500">
                    No lessons available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Curriculum</p>
          <h2 className="mt-2 text-2xl font-bold">Course Lessons</h2>
          <p className="mt-2 text-sm text-slate-500">
            {completedCount} of {lessons.length} lessons completed
          </p>
        </div>

        <div className="mt-6 max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Your progress</span>
            <span className="text-sm font-semibold text-blue-400">{progress}%</span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {hasLessons ? (
          <div className="mt-8 max-w-4xl space-y-3">
            {lessons.map((lesson, index) => {
              const p = progressById.get(lesson.id) || { locked: index > 0, status: "pending" };
              const isLocked = p.locked;
              const isApproved = p.completed;
              const isRejected = p.status === "rejected";
              const isSubmitted = p.status === "submitted";

              return (
                <div
                  key={lesson.id}
                  className={`group rounded-2xl border transition-all ${
                    isApproved
                      ? "border-emerald-500/10 bg-emerald-500/5"
                      : isLocked
                      ? "border-slate-800 bg-slate-900/40"
                      : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-4 p-4 md:p-5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-400"
                          : isLocked
                          ? "bg-slate-800 text-slate-600"
                          : isRejected
                          ? "bg-red-500/10 text-red-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 size={20} />
                      ) : isLocked ? (
                        <Lock size={18} />
                      ) : isRejected ? (
                        <XCircle size={18} />
                      ) : (
                        <span className="text-sm font-semibold">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate text-sm font-semibold ${
                          isLocked ? "text-slate-600" : "text-slate-200"
                        }`}
                      >
                        {lesson.title}
                      </h3>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        <Clock3 size={13} />
                        {lesson.duration}
                        {isSubmitted && (
                          <span className="text-amber-400">· Awaiting teacher review</span>
                        )}
                      </div>

                      {(isApproved || isRejected) && p.remark && (
                        <p
                          className={`mt-2 rounded-lg px-3 py-2 text-xs leading-5 ${
                            isApproved
                              ? "bg-emerald-500/5 text-emerald-300"
                              : "bg-red-500/5 text-red-300"
                          }`}
                        >
                          <span className="font-medium">Teacher's remark: </span>
                          {p.remark}
                        </p>
                      )}
                    </div>

                    {isApproved ? (
                      <Link
                        to={`/student/courses/${courseId}/lesson/${lesson.id}`}
                        className="hidden shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10 sm:flex"
                      >
                        Review
                        <ArrowRight size={14} />
                      </Link>
                    ) : isLocked ? (
                      <div className="hidden items-center gap-2 text-xs text-slate-600 sm:flex">
                        <Lock size={14} />
                        Locked
                      </div>
                    ) : (
                      <Link
                        to={`/student/courses/${courseId}/lesson/${lesson.id}`}
                        className={`hidden shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition sm:flex ${
                          isRejected ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"
                        }`}
                      >
                        <Play size={14} />
                        {isSubmitted ? "View" : isRejected ? "Resubmit" : "Start"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 max-w-4xl rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-14 text-center">
            <BookOpen size={32} className="mx-auto text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold">No lessons yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              The teacher hasn't added any lessons to this course yet.
            </p>
          </div>
        )}

        {hasLessons && nextLesson && (
          <div className="mt-12 max-w-4xl rounded-3xl border border-blue-500/10 bg-blue-500/5 p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-400">Ready to continue?</p>
                <h3 className="mt-1 text-xl font-bold">Keep building your learning streak.</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Continue with your next lesson and make steady progress.
                </p>
              </div>

              <Link
                to={`/student/courses/${courseId}/lesson/${nextLesson.id}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Continue
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CourseDetails;
