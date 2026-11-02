import StudentNavbar from "../components/student/StudentNavbar";
import TaskDrawer from "../components/organize/TaskDrawer";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useFocus } from "../context/FocusContext";

import {
  Brain,
  Clock3,
  CheckCircle2,
  Circle,
  ClipboardList,
  Flame,
  BookOpen,
  TrendingUp,
  Users,
  ArrowRight,
  ExternalLink,
  Play,
  UploadCloud,
  Timer,
  CheckSquare,
} from "lucide-react";

import { focusApi, organizeApi, courseApi, openBase64Pdf, ApiError } from "../lib/api";

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

const TASK_STATUS_META = {
  pending: { label: "Not started", className: "bg-slate-800 text-slate-500" },
  submitted: { label: "Awaiting review", className: "bg-amber-500/10 text-amber-400" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-400" },
  rejected: { label: "Changes requested", className: "bg-red-500/10 text-red-400" },
};

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function StudentDashboard() {
  const { setFocusDrawerOpen } = useFocus();
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [focusStats, setFocusStats] = useState(null);
  const [tasksToday, setTasksToday] = useState([]);
  const [organizeSummary, setOrganizeSummary] = useState(null);

  const [courseTasks, setCourseTasks] = useState([]);
  const [courseTasksLoading, setCourseTasksLoading] = useState(true);
  // Per-task submission drafts, keyed by `${courseId}:${lessonId}`.
  const [taskSubmitDrafts, setTaskSubmitDrafts] = useState({});
  const fileInputsRef = useRef({});

  const loadCourseTasks = () => {
    setCourseTasksLoading(true);
    courseApi
      .studentTasks()
      .then((res) => setCourseTasks(res.tasks || []))
      .catch(() => {})
      .finally(() => setCourseTasksLoading(false));
  };

  useEffect(() => {
    focusApi.stats().then(setFocusStats).catch(() => {});
    organizeApi.listTasks(todayStr()).then((res) => setTasksToday(res.tasks)).catch(() => {});
    organizeApi.summary().then(setOrganizeSummary).catch(() => {});
    loadCourseTasks();
  }, []);

  const setTaskDraft = (key, patch) => {
    setTaskSubmitDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  };

  const handleTaskFilePick = (key, e) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== "application/pdf") {
      setTaskDraft(key, { error: "Only PDF files can be submitted." });
      return;
    }
    setTaskDraft(key, { file, error: "" });
  };

  const submitCourseTask = async (item) => {
    const key = `${item.courseId}:${item.lessonId}`;
    const draft = taskSubmitDrafts[key] || {};
    if (!draft.file) {
      setTaskDraft(key, { error: "Choose a PDF file first." });
      return;
    }

    setTaskDraft(key, { submitting: true, error: "" });
    try {
      const fileData = await readFileAsBase64(draft.file);
      await courseApi.submitLessonTask(item.courseId, item.lessonId, {
        fileName: draft.file.name,
        fileData,
      });
      setTaskDraft(key, { submitting: false, file: null, error: "" });
      if (fileInputsRef.current[key]) fileInputsRef.current[key].value = "";
      loadCourseTasks();
    } catch (err) {
      setTaskDraft(key, {
        submitting: false,
        error: err instanceof ApiError ? err.message : "Couldn't submit that file.",
      });
    }
  };

  const viewTaskPdf = async (item) => {
    try {
      const { task } = await courseApi.getLessonTask(item.courseId, item.lessonId);
      if (task?.fileData) openBase64Pdf(task.fileName, task.fileData);
    } catch {
      // ignore — nothing to view
    }
  };

  const openCourseTasks = courseTasks.filter(
    (t) => t.submissionStatus === "pending" || t.submissionStatus === "rejected"
  );

  const weeklyCompletionPct =
    organizeSummary && organizeSummary.weekTasksTotal > 0
      ? Math.round((organizeSummary.weekTasksCompleted / organizeSummary.weekTasksTotal) * 100)
      : 0;

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          STUDENT NAVBAR & TASK DRAWER
      ===================================================== */}

      <StudentNavbar />
      <TaskDrawer open={taskDrawerOpen} onClose={() => setTaskDrawerOpen(false)} />


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-12">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

          <div>

            <p className="text-sm font-medium text-blue-400">
              STUDENT DASHBOARD
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Welcome back 👋
            </h1>

            <p className="mt-3 text-slate-400">
              Keep learning, stay focused, and make progress today.
            </p>

          </div>


        </div>


        {/* =====================================================
            STATS
        ===================================================== */}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Lesson Streak */}

          <div className="dashboard-card stagger-in stagger-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Lesson Streak
              </p>

              <Flame
                size={20}
                className="text-orange-400"
              />

            </div>

            <p className="mt-4 text-3xl font-bold">
              {focusStats ? focusStats.streakDays : 0}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              {focusStats?.streakDays > 0 ? "🔥 Active daily streak" : "Complete 1 lesson today to build streak!"}
            </p>

          </div>


          {/* Today's Study Time */}

          <div className="dashboard-card stagger-in stagger-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Today's Activity
              </p>

              <Clock3
                size={20}
                className="text-blue-400"
              />

            </div>

            <p className="mt-4 text-3xl font-bold">
              {focusStats ? formatDuration(focusStats.today?.seconds || 0) : "0m"}
            </p>

            <p className="mt-2 text-xs text-blue-400">
              {focusStats?.today?.sessions || 0} session{focusStats?.today?.sessions === 1 ? "" : "s"} today ({focusStats ? formatDuration(focusStats.allTime?.seconds || 0) : "0m"} total)
            </p>

          </div>


          {/* To-Do List Tasks (Clickable Card opens TaskDrawer) */}

          <button
            type="button"
            onClick={() => setTaskDrawerOpen(true)}
            className="dashboard-card stagger-in stagger-3 text-left rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition p-5"
          >

            <div className="flex items-center justify-between">

              <p className="text-sm text-blue-400 font-semibold">
                To-Do List Tasks
              </p>

              <CheckSquare
                size={20}
                className="text-blue-400"
              />

            </div>

            <p className="mt-4 text-3xl font-bold text-white">
              {organizeSummary ? organizeSummary.totalCompletedTasks || organizeSummary.tasksCompletedAllTime || 0 : 0}
            </p>

            <p className="mt-2 text-xs text-blue-400 font-medium">
              Click to open To-Do List →
            </p>

          </button>


          {/* Progress */}

          <Link
            to="/progress"
            className="dashboard-card stagger-in stagger-4 text-left rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-purple-500/40 transition p-5"
          >

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Progress
              </p>

              <TrendingUp
                size={20}
                className="text-purple-400"
              />

            </div>

            <p className="mt-4 text-3xl font-bold">
              {organizeSummary ? `${weeklyCompletionPct}%` : "—"}
            </p>

            <p className="mt-2 text-xs text-purple-400">
              View Digital Wellbeing →
            </p>

          </Link>

        </div>


        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <div className="mt-8">

          {/* =================================================
              AI MENTOR BANNER
          ================================================= */}

          <div className="dashboard-card rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div className="flex items-center gap-4">

              <div className="ai-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Brain size={26} />
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  AI ASSISTANT
                </p>

                <h2 className="text-xl font-bold text-slate-100">
                  AI Mentor
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Need help understanding concepts or instant guidance with your study plan?
                </p>

              </div>

            </div>


            <Link
              to="/ai-mentor"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/30"
            >
              Talk to AI Mentor

              <ArrowRight
                size={17}
              />
            </Link>

          </div>

        </div>


        {/* =====================================================
            COURSE TASKS (DPPs assigned by teachers)
            Never gated on lesson order — every task a teacher has
            assigned shows up here the moment it exists, and stays
            here until it's submitted. Complete it right from this
            panel; the PDF goes straight to the teacher.
        ===================================================== */}

        <div className="dashboard-card mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ClipboardList size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">TASKS</p>
                <h2 className="font-semibold">Course Tasks</h2>
              </div>
            </div>
            {openCourseTasks.length > 0 && (
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {openCourseTasks.length} open
              </span>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {courseTasksLoading ? (
              <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-600">
                Loading tasks…
              </p>
            ) : courseTasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-600">
                No tasks assigned yet. When a teacher adds one to a lesson, it'll show up here.
              </p>
            ) : (
              courseTasks.map((item) => {
                const key = `${item.courseId}:${item.lessonId}`;
                const draft = taskSubmitDrafts[key] || {};
                const meta = TASK_STATUS_META[item.submissionStatus] || TASK_STATUS_META.pending;
                const isOpen = item.submissionStatus === "pending" || item.submissionStatus === "rejected";

                return (
                  <div key={key} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-slate-600">
                          {item.courseTitle} · Lesson {item.lessonPosition + 1}
                        </p>
                        <p className="mt-0.5 font-medium text-slate-200">{item.task.title}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>

                    {item.task.instructions && (
                      <p className="mt-2 text-sm text-slate-500">{item.task.instructions}</p>
                    )}

                    {item.task.hasFile && (
                      <button
                        type="button"
                        onClick={() => viewTaskPdf(item)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink size={13} />
                        View {item.task.fileName || "assignment PDF"}
                      </button>
                    )}

                    {item.submissionStatus === "rejected" && item.remark && (
                      <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                        {item.remark}
                      </p>
                    )}

                    {item.submissionStatus === "approved" && item.remark && (
                      <p className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
                        {item.remark}
                      </p>
                    )}

                    {isOpen && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400 transition hover:border-emerald-500/40">
                          <UploadCloud size={14} className="shrink-0 text-emerald-400" />
                          <span className="min-w-0 flex-1 truncate">
                            {draft.file?.name || "Choose a PDF to submit"}
                          </span>
                          <input
                            ref={(el) => (fileInputsRef.current[key] = el)}
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handleTaskFilePick(key, e)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => submitCourseTask(item)}
                          disabled={draft.submitting || !draft.file}
                          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {draft.submitting ? "Sending…" : "Send to teacher"}
                        </button>
                      </div>
                    )}
                    {draft.error && <p className="mt-2 text-xs text-red-400">{draft.error}</p>}
                  </div>
                );
              })
            )}
          </div>

        </div>


        {/* =====================================================
            LOWER GRID
        ===================================================== */}

        <div className="mt-6 grid gap-6 md:grid-cols-3">

          {/* Courses */}

          <div className="dashboard-card rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <BookOpen size={22} />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Continue Learning
            </h3>

            <p className="mt-3 leading-7 text-slate-400">
              Continue your enrolled courses and pick up
              exactly where you stopped.
            </p>

            <Link
              to="/platforms"
              className="mt-7 inline-flex items-center text-blue-400"
            >
              Explore Courses
              <ArrowRight
                size={17}
                className="ml-2"
              />
            </Link>

          </div>


          {/* Progress */}

          <div className="dashboard-card rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp size={22} />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Your Progress
            </h3>

            <p className="mt-3 leading-7 text-slate-400">
              See your study consistency, completed goals,
              and overall learning progress.
            </p>

            <Link
              to="/progress"
              className="mt-7 inline-flex items-center text-purple-400"
            >
              View Progress
              <ArrowRight
                size={17}
                className="ml-2"
              />
            </Link>

          </div>


          {/* Community */}

          <div className="dashboard-card rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users size={22} />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Community
            </h3>

            <p className="mt-3 leading-7 text-slate-400">
              Connect with other learners, share ideas,
              ask questions, and grow together.
            </p>

            <Link
              to="/community"
              className="mt-7 inline-flex items-center text-emerald-400"
            >
              Explore Community
              <ArrowRight
                size={17}
                className="ml-2"
              />
            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}

export default StudentDashboard;