import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Trophy,
  Clock,
  TrendingUp,
  CheckCircle2,
  BookOpen,
  Zap,
  BarChart3,
  Sparkles,
  RefreshCw,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { focusApi, organizeApi, courseApi } from "../lib/api";

function formatSeconds(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatDateLabel(dateStr) {
  try {
    const date = new Date(`${dateStr}T00:00:00Z`);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    return { dayName, monthDay };
  } catch {
    return { dayName: dateStr, monthDay: dateStr };
  }
}

function Progress() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    today: { seconds: 0, minutes: 0, sessions: 0 },
    thisWeek: { seconds: 0, minutes: 0, sessions: 0 },
    allTime: { seconds: 0, minutes: 0, sessions: 0 },
    streakDays: 0,
    maxStreakDays: 0,
    history30Days: [],
  });

  const [taskSummary, setTaskSummary] = useState({
    totalCompletedTasks: 0,
    history30Days: [],
  });

  const [subjects, setSubjects] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [timeframe, setTimeframe] = useState(7); // 7, 14, or 30 days

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [focusRes, taskRes, subRes, courseRes] = await Promise.all([
        focusApi.stats().catch(() => null),
        organizeApi.summary().catch(() => null),
        organizeApi.listSubjects().catch(() => ({ subjects: [] })),
        courseApi.myEnrolledCourses().catch(() => ({ courses: [] })),
      ]);

      if (focusRes) {
        setStats(focusRes);
      }
      if (taskRes) {
        setTaskSummary(taskRes);
      }
      if (subRes?.subjects) {
        setSubjects(subRes.subjects);
      }
      if (courseRes?.courses) {
        setEnrolledCourses(courseRes.courses);
      }
    } catch (err) {
      console.error("Failed to load progress stats:", err);
      setError("Unable to load latest stats. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter history for bar graph according to selected timeframe
  const historyData = (stats.history30Days || []).slice(-timeframe);
  const maxMinutes = Math.max(...historyData.map((d) => d.minutes), 30); // scale max at least 30m

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="page-enter min-h-screen bg-slate-950 px-4 py-10 sm:px-6 sm:py-16 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-400">
              <BarChart3 className="size-3.5" />
              Digital Wellbeing & Progress
            </div>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl md:text-5xl text-slate-100">
              Your Learning Journey
            </h1>
            <p className="mt-2 text-slate-400 max-w-2xl text-sm sm:text-base">
              Track daily usage time, active study streaks, course completions, and subject mastery.
            </p>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Stats"}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* Overview Metric Cards */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Active Streak */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-6 shadow-lg shadow-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Active Streak
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Flame className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">
                {stats.streakDays}
              </span>
              <span className="text-sm font-medium text-slate-400">days</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats.streakDays > 0
                ? "Lesson completed today! Streak maintained 🔥"
                : "Complete 1 lesson today to keep your streak going!"}
            </p>
          </div>

          {/* Longest Streak */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-slate-900 to-slate-950 p-6 shadow-lg shadow-purple-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Max Streak Achieved
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                <Trophy className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">
                {stats.maxStreakDays}
              </span>
              <span className="text-sm font-medium text-slate-400">days</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Your all-time longest consecutive study record.
            </p>
          </div>

          {/* Today's Activity */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-950 p-6 shadow-lg shadow-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Today's Usage Time
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <Clock className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">
                {formatSeconds(stats.today?.seconds)}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats.today?.sessions || 0} focus session(s) logged today.
            </p>
          </div>

          {/* All-Time Study Time */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 p-6 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                All-Time Study Time
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Zap className="size-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {formatSeconds(stats.allTime?.seconds)}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Across all logged focus mode sessions.
            </p>
          </div>
        </div>

        {/* Enrolled Courses & Completion Section */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <GraduationCap className="size-5 text-blue-400" />
                Enrolled Courses & Completion Progress
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Monitor your current learning progress across enrolled courses.
              </p>
            </div>

            <Link
              to="/student/courses"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 self-start sm:self-auto"
            >
              View My Courses <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Loading enrolled courses...
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                You are not currently enrolled in any courses. Explore courses to get started!
                <div className="mt-3">
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition"
                  >
                    Explore Courses
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {enrolledCourses.map((course) => {
                  const pct = course.progressPct ?? 0;
                  const lessonsCount = course.lessons?.length || 0;
                  const completedLessons = course.lessons?.filter(
                    (l) => course.lessonProgress?.[l.id]?.completed
                  )?.length || 0;

                  return (
                    <div
                      key={course.id}
                      className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-5 hover:border-blue-500/50 transition duration-300"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {course.thumbnail ? (
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="size-12 rounded-lg object-cover border border-slate-800"
                              />
                            ) : (
                              <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                                <BookOpen className="size-6" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-slate-100 text-sm group-hover:text-blue-400 transition">
                                {course.title}
                              </h3>
                              <p className="text-xs text-slate-500">
                                Instructor: {course.instructorName || "StudySphere Faculty"}
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-400">
                            {pct}% Completed
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                            <span>Progress</span>
                            <span>
                              {completedLessons} of {lessonsCount} lesson{lessonsCount === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end">
                        <Link
                          to={`/student/courses`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition"
                        >
                          Continue Learning <ChevronRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Main Grid: Bar Graph + Wellbeing Card */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Daily Usage Time Bar Graph (2 columns) */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="size-5 text-blue-400" />
                  Daily Usage Time (Digital Wellbeing)
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Total active minutes spent on StudySphere per day.
                </p>
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
                {[
                  { label: "7 Days", value: 7 },
                  { label: "14 Days", value: 14 },
                  { label: "30 Days", value: 30 },
                ].map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setTimeframe(tf.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      timeframe === tf.value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Bar Chart */}
            <div className="mt-8">
              {loading ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  Loading activity history...
                </div>
              ) : historyData.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  No activity recorded yet for this timeframe.
                </div>
              ) : (
                <div className="relative">
                  {/* Y-Axis guide lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 border-b border-slate-700">
                    <div className="border-b border-slate-600 w-full" />
                    <div className="border-b border-slate-600 w-full" />
                    <div className="border-b border-slate-600 w-full" />
                  </div>

                  {/* Bars container */}
                  <div className="relative z-10 flex h-64 items-end justify-between gap-1.5 sm:gap-3 pt-6 pb-2 px-1">
                    {historyData.map((item) => {
                      const isToday = item.date === todayStr;
                      const heightPct = Math.max(Math.round((item.minutes / maxMinutes) * 100), item.minutes > 0 ? 6 : 2);
                      const { dayName, monthDay } = formatDateLabel(item.date);

                      return (
                        <div
                          key={item.date}
                          className="group relative flex flex-1 flex-col items-center justify-end h-full"
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-12 z-30 hidden group-hover:flex flex-col items-center rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-center text-xs shadow-xl pointer-events-none whitespace-nowrap">
                            <span className="font-semibold text-slate-200">{monthDay}</span>
                            <span className="text-blue-400 font-bold">{item.minutes} mins ({formatSeconds(item.seconds)})</span>
                          </div>

                          {/* Bar */}
                          <div
                            className={`w-full max-w-12 rounded-t-md sm:rounded-t-lg transition-all duration-300 ${
                              isToday
                                ? "bg-gradient-to-t from-blue-600 to-cyan-400 shadow-md shadow-cyan-500/20"
                                : item.minutes > 0
                                ? "bg-gradient-to-t from-blue-700 to-indigo-500 hover:from-blue-600 hover:to-indigo-400"
                                : "bg-slate-800/60"
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />

                          {/* Date label */}
                          <div className="mt-2 text-center">
                            <span className={`block text-[10px] sm:text-xs ${isToday ? "font-bold text-cyan-400" : "text-slate-400"}`}>
                              {timeframe <= 14 ? dayName : monthDay.split(" ")[1]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Legend & Summary footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded bg-cyan-400 shadow-sm shadow-cyan-400/50" /> Today
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded bg-indigo-500" /> Active Days
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded bg-slate-800" /> Inactive Days
                </span>
              </div>
              <div>
                Total in selected period: <strong className="text-slate-200">{formatSeconds(historyData.reduce((acc, curr) => acc + curr.seconds, 0))}</strong>
              </div>
            </div>
          </section>

          {/* Right Panel: Digital Wellbeing Tips & Task Stats */}
          <div className="space-y-6">
            {/* Task Completion Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                  <CheckCircle2 className="size-5 text-emerald-400" />
                  To-Do Task Progress
                </h3>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 p-4 border border-slate-800">
                <div>
                  <p className="text-2xl font-extrabold text-white">
                    {taskSummary.totalCompletedTasks}
                  </p>
                  <p className="text-xs text-slate-400">Tasks completed all-time</p>
                </div>
                <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="size-6" />
                </div>
              </div>
            </div>

            {/* Digital Wellbeing Tips */}
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 p-6">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                Wellbeing & Habit Insights
              </h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
                  <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Flame className="size-3.5" /> Streak Protection Rules
                  </p>
                  <p className="mt-1 text-slate-400 leading-relaxed">
                    Complete at least <strong>1 lesson</strong> daily to increment your continuous streak counter. Missing a day resets the active streak to 0!
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
                  <p className="font-semibold text-blue-400 flex items-center gap-1.5">
                    <Clock className="size-3.5" /> Focus Sessions
                  </p>
                  <p className="mt-1 text-slate-400 leading-relaxed">
                    Use the floating Focus Mode timer while reading or watching lessons. Time logged accumulates directly into your daily digital wellbeing chart.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Progress Section */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="size-5 text-purple-400" />
                Subject Mastery & Topics Progress
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Subject topics completed from your organized workspace.
              </p>
            </div>
          </div>

          <div className="mt-6">
            {subjects.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500">
                No subjects registered yet. Create subjects in your Organize task drawer to track topic progress!
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {subjects.map((sub) => {
                  const pct = sub.progress_pct ?? sub.progressPct ?? 0;
                  return (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{sub.icon || "📘"}</span>
                          <div>
                            <p className="font-semibold text-slate-200 text-sm">{sub.name}</p>
                            <p className="text-xs text-slate-500">
                              {sub.topics_count || sub.topicsCount || 0} topics registered
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-blue-400">{pct}%</span>
                      </div>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Progress;