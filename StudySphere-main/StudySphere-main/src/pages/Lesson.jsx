import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFocus } from "../context/FocusContext";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  ExternalLink,
  FileText,
  List,
  Lock,
  Timer,
  UploadCloud,
  XCircle,
} from "lucide-react";

import { courseApi, ApiError, openBase64Pdf } from "../lib/api";

const STATUS_META = {
  locked: { label: "Locked", className: "bg-slate-800 text-slate-500" },
  pending: { label: "Not started", className: "bg-slate-800 text-slate-500" },
  submitted: { label: "Awaiting review", className: "bg-amber-500/10 text-amber-400" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-400" },
  rejected: { label: "Changes requested", className: "bg-red-500/10 text-red-400" },
};

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

function Lesson() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { startFocusTimer } = useFocus();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [taskPdfLoading, setTaskPdfLoading] = useState(false);

  const load = () => {
    setLoading(true);
    courseApi
      .myEnrolledCourse(courseId)
      .then((data) => {
        setCourse(data.course);
        setLoadError("");
      })
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : "Couldn't load this course.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    setSelectedFile(null);
    setSubmitError("");
    startFocusTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  /* =====================================================
     LOADING / ERROR
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Course not accessible</h1>
          <p className="mt-2 text-sm text-slate-400">{loadError || "Not found."}</p>
          <Link
            to="/student/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <ArrowLeft size={16} />
            Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const currentLessonIndex = lessons.findIndex((l) => String(l.id) === String(lessonId));
  const currentLesson = currentLessonIndex >= 0 ? lessons[currentLessonIndex] : lessons[0];

  if (!currentLesson) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No lessons found in this course.</h1>
          <Link
            to={`/student/courses/${courseId}`}
            className="mt-5 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft size={16} />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const progressList = Array.isArray(course.progress) ? course.progress : [];
  const progressById = new Map(progressList.map((p) => [String(p.lessonId), p]));

  const currentProgress = progressById.get(String(currentLesson.id)) || { locked: currentLessonIndex > 0, status: "pending" };

  /* =====================================================
     LOCKED LESSON — block access, send them back
  ===================================================== */

  if (currentProgress.locked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
            <Lock size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-bold">This lesson is locked</h1>
          <p className="mt-2 text-sm text-slate-500">
            Submit your task answer for the previous lesson to unlock "{currentLesson.title}".
          </p>
          <Link
            to={`/student/courses/${courseId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <ArrowLeft size={16} />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const previousLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < lessons.length - 1 ? lessons[currentLessonIndex + 1] : null;
  const nextLessonProgress = nextLesson ? progressById.get(nextLesson.id) : null;
  const nextLessonLocked = nextLesson ? nextLessonProgress?.locked !== false : false;

  const videoId = currentLesson.videoId;
  const status = currentProgress.status;
  const statusMeta = STATUS_META[status] || STATUS_META.pending;

  /* =====================================================
     TASK SUBMISSION (the lesson's PDF task-completion section)
  ===================================================== */

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSubmitError("");

    if (file && file.type !== "application/pdf") {
      setSelectedFile(null);
      setSubmitError("Only PDF files can be submitted for this task.");
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmitTask = async () => {
    if (!selectedFile) {
      setSubmitError("Choose a PDF file to submit first.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const fileData = await readFileAsBase64(selectedFile);
      await courseApi.submitLessonTask(courseId, currentLesson.id, {
        fileName: selectedFile.name,
        fileData,
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't submit that file. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async () => {
    setCompleting(true);
    try {
      await courseApi.completeLesson(courseId, currentLesson.id, !currentProgress.completed);
      load();
    } catch {
      // Non-critical — just let them try again.
    } finally {
      setCompleting(false);
    }
  };

  const viewTaskPdf = async () => {
    setTaskPdfLoading(true);
    try {
      const { task } = await courseApi.getLessonTask(courseId, currentLesson.id);
      if (task?.fileData) openBase64Pdf(task.fileName, task.fileData);
    } catch {
      // Nothing to view / not accessible — ignore.
    } finally {
      setTaskPdfLoading(false);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">
      {/* TOP BAR */}
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => navigate(`/student/courses/${courseId}`)}
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">Back to Course</span>
          </button>

          <div className="hidden max-w-md truncate text-sm font-medium text-slate-300 sm:block">
            {course.title}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => startFocusTimer(25, `Lesson: ${currentLesson.title}`)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
            >
              <Timer size={14} />
              <span>Start Focus</span>
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BookOpen size={16} />
              Lesson {currentLessonIndex + 1} of {lessons.length}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* LEFT CONTENT */}
          <div>
            {/* VIDEO */}
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-black">
              {videoId ? (
                <div className="aspect-video">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={currentLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-blue-950/30">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600/10 text-blue-400">
                    <BookOpen size={32} />
                  </div>
                  <p className="mt-5 text-sm font-medium text-slate-300">Video not available</p>
                  <p className="mt-2 text-xs text-slate-600">This lesson does not have a video yet.</p>
                </div>
              )}
            </div>

            {/* LESSON INFO */}
            <div className="mt-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                  {course.title}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock3 size={14} />
                  {currentLesson.duration || "Duration unavailable"}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{currentLesson.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">{currentLesson.description}</p>

              {/* =================================================
                  MARK LESSON COMPLETE
                  Drives the course progress bar. Independent of the
                  task/submission review below — watching a lesson is
                  never gated behind a teacher's approval.
              ================================================= */}
              <button
                type="button"
                onClick={toggleComplete}
                disabled={completing}
                className={`mt-6 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  currentProgress.completed
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-500/40 hover:text-white"
                }`}
              >
                {currentProgress.completed ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                {completing
                  ? "Updating…"
                  : currentProgress.completed
                  ? "Lesson completed"
                  : "Mark lesson as complete"}
              </button>

              {/* =================================================
                  TEACHER'S TASK (DPP), IF ONE WAS ASSIGNED
              ================================================= */}
              {currentLesson.task && (
                <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={18} className="text-emerald-400" />
                    <h2 className="font-semibold text-emerald-400">{currentLesson.task.title}</h2>
                  </div>
                  {currentLesson.task.instructions && (
                    <p className="mt-2 text-sm leading-6 text-slate-400">{currentLesson.task.instructions}</p>
                  )}
                  {currentLesson.task.hasFile && (
                    <button
                      type="button"
                      onClick={viewTaskPdf}
                      disabled={taskPdfLoading}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-60"
                    >
                      <ExternalLink size={13} />
                      {taskPdfLoading ? "Opening…" : `View ${currentLesson.task.fileName || "assignment PDF"}`}
                    </button>
                  )}
                </div>
              )}

              {/* =================================================
                  TASK COMPLETION SECTION
                  Every lesson's task: upload a PDF, teacher reviews it.
              ================================================= */}
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-400" />
                  <h2 className="font-semibold">Lesson Task</h2>
                </div>
                <p className="mt-1.5 text-sm text-slate-500">
                  Upload a PDF for this lesson's task whenever you're ready — it's sent straight
                  to your teacher for review. You can move on to the next lesson any time; this
                  is never a gate.
                </p>

                {status === "approved" && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">Task approved</p>
                      {currentProgress.remark && (
                        <p className="mt-1 text-sm text-slate-400">
                          <span className="font-medium text-slate-300">Teacher's remark: </span>
                          {currentProgress.remark}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {status === "submitted" && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3.5">
                    <Clock3 size={20} className="mt-0.5 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-sm font-semibold text-amber-400">Submitted — awaiting review</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {currentProgress.fileName ? `You submitted "${currentProgress.fileName}".` : "Your submission is in."} Your teacher hasn't evaluated it yet.
                      </p>
                    </div>
                  </div>
                )}

                {(status === "pending" || status === "rejected") && (
                  <div className="mt-4 space-y-3">
                    {status === "rejected" && currentProgress.remark && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5">
                        <XCircle size={20} className="mt-0.5 shrink-0 text-red-400" />
                        <div>
                          <p className="text-sm font-semibold text-red-400">Changes requested</p>
                          <p className="mt-1 text-sm text-slate-400">{currentProgress.remark}</p>
                        </div>
                      </div>
                    )}

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 px-4 py-4 text-sm text-slate-400 transition hover:border-blue-500/40">
                      <UploadCloud size={18} className="shrink-0 text-blue-400" />
                      <span className="min-w-0 flex-1 truncate">
                        {selectedFile ? selectedFile.name : "Choose a PDF file to submit"}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {submitError && <p className="text-sm text-red-400">{submitError}</p>}

                    <button
                      type="button"
                      onClick={handleSubmitTask}
                      disabled={submitting || !selectedFile}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UploadCloud size={18} />
                      {submitting ? "Submitting…" : status === "rejected" ? "Resubmit PDF" : "Submit PDF"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PREVIOUS / NEXT */}
            <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {previousLesson ? (
                <Link
                  to={`/student/courses/${courseId}/lesson/${previousLesson.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 transition hover:border-slate-700"
                >
                  <ChevronLeft size={18} className="text-slate-500 transition group-hover:text-white" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-600">Previous</p>
                    <p className="mt-1 text-sm font-medium text-slate-300">{previousLesson.title}</p>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextLesson ? (
                nextLessonLocked ? (
                  <div
                    title="Get this lesson's task approved to unlock the next one"
                    className="flex cursor-not-allowed items-center justify-end gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-right opacity-60"
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-600">Next Lesson</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{nextLesson.title}</p>
                    </div>
                    <Lock size={16} className="text-slate-600" />
                  </div>
                ) : (
                  <Link
                    to={`/student/courses/${courseId}/lesson/${nextLesson.id}`}
                    className="group flex items-center justify-end gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-right transition hover:border-blue-500/30"
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-600">Next Lesson</p>
                      <p className="mt-1 text-sm font-medium text-slate-300">{nextLesson.title}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-500 transition group-hover:text-blue-400" />
                  </Link>
                )
              ) : (
                <Link
                  to={`/student/courses/${courseId}`}
                  className="group flex items-center gap-3 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Finish Course
                  <ArrowRight size={17} />
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="h-fit overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
            <div className="border-b border-slate-800 p-5">
              <div className="flex items-center gap-2">
                <List size={18} className="text-blue-400" />
                <h2 className="font-semibold">Course Content</h2>
              </div>
              <p className="mt-2 text-xs text-slate-500">{lessons.length} lessons</p>
            </div>

            <div className="max-h-155 overflow-y-auto p-3">
              {lessons.map((lesson, index) => {
                const isCurrent = String(lesson.id) === String(currentLesson.id);
                const p = progressById.get(lesson.id) || { locked: index > 0, status: "pending" };
                const isApproved = p.completed;
                const isLocked = p.locked;

                return (
                  <Link
                    key={lesson.id}
                    to={isLocked ? "#" : `/student/courses/${courseId}/lesson/${lesson.id}`}
                    onClick={(e) => isLocked && e.preventDefault()}
                    className={`mb-1 flex items-center gap-3 rounded-xl p-3 transition ${
                      isCurrent ? "bg-blue-500/10" : isLocked ? "cursor-not-allowed opacity-60" : "hover:bg-slate-800/70"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-400"
                          : isCurrent
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 size={17} />
                      ) : isLocked ? (
                        <Lock size={15} />
                      ) : (
                        <span className="text-xs font-semibold">{String(index + 1).padStart(2, "0")}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${isCurrent ? "text-blue-400" : "text-slate-300"}`}>
                        {lesson.title}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">{lesson.duration}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Lesson;
