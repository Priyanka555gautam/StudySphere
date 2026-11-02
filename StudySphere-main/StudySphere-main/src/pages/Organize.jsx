import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Pause, Play, Plus, RotateCcw, Trash2 } from "lucide-react";

import { organizeApi } from "../lib/api";

const PRIORITY_STYLES = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  low: "bg-green-500/10 text-green-400",
};

const SUBJECT_ICONS = ["📘", "💻", "⚛️", "🗄️", "⚙️", "🧪", "📐", "🌍"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function Organize() {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newSubject, setNewSubject] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);

  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDuration, setNewTaskDuration] = useState(30);
  const [addingTask, setAddingTask] = useState(false);

  // Exact countdown timer per to-do item: { [taskId]: { secondsLeft, running } }.
  // Lives only in this tab's memory — it's a study aid, not a stored record.
  const [timers, setTimers] = useState({});

  const today = todayStr();

  const loadAll = () => {
    Promise.all([
      organizeApi.listSubjects(),
      organizeApi.listTasks(today),
      organizeApi.summary(),
    ])
      .then(([subjectsRes, tasksRes, summaryRes]) => {
        setSubjects(subjectsRes.subjects);
        setTasks(tasksRes.tasks);
        setSummary(summaryRes);
        setError(null);
      })
      .catch(() => setError("Couldn't load your Organize data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single shared ticker for every running timer — precise to the second.
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [taskId, t] of Object.entries(prev)) {
          if (!t.running) continue;
          changed = true;
          if (t.secondsLeft <= 1) {
            next[taskId] = { ...t, secondsLeft: 0, running: false, justFinished: true };
          } else {
            next[taskId] = { ...t, secondsLeft: t.secondsLeft - 1 };
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // When a timer hits zero, mark the task complete automatically.
  useEffect(() => {
    Object.entries(timers).forEach(([taskId, t]) => {
      if (t.secondsLeft === 0 && t.justFinished) {
        setTimers((prev) => ({ ...prev, [taskId]: { ...prev[taskId], justFinished: false } }));
        const task = tasks.find((tk) => String(tk.id) === String(taskId));
        if (task && !task.completed) handleToggleTask(task);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timers]);

  const startTimer = (task) => {
    setTimers((prev) => {
      const existing = prev[task.id];
      const secondsLeft = existing && existing.secondsLeft > 0 ? existing.secondsLeft : (task.durationMin || 30) * 60;
      return { ...prev, [task.id]: { secondsLeft, running: true, justFinished: false } };
    });
  };

  const pauseTimer = (taskId) => {
    setTimers((prev) => (prev[taskId] ? { ...prev, [taskId]: { ...prev[taskId], running: false } } : prev));
  };

  const resetTimer = (task) => {
    setTimers((prev) => ({
      ...prev,
      [task.id]: { secondsLeft: (task.durationMin || 30) * 60, running: false, justFinished: false },
    }));
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    const name = newSubject.trim();
    if (!name) return;

    setAddingSubject(true);
    try {
      const icon = SUBJECT_ICONS[subjects.length % SUBJECT_ICONS.length];
      const { subject } = await organizeApi.createSubject({ name, icon });
      setSubjects((prev) => [...prev, subject]);
      setSummary((prev) => (prev ? { ...prev, activeSubjects: prev.activeSubjects + 1 } : prev));
      setNewSubject("");
    } catch {
      setError("Couldn't add that subject.");
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    const prevSubjects = subjects;
    setSubjects((prev) => prev.filter((s) => s.id !== id));

    try {
      await organizeApi.deleteSubject(id);
      setSummary((prev) => (prev ? { ...prev, activeSubjects: Math.max(0, prev.activeSubjects - 1) } : prev));
    } catch {
      setSubjects(prevSubjects);
      setError("Couldn't delete that subject.");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const title = newTask.trim();
    if (!title) return;

    setAddingTask(true);
    try {
      const { task } = await organizeApi.createTask({
        title,
        priority: newTaskPriority,
        durationMin: Number(newTaskDuration) || 30,
        date: today,
      });
      setTasks((prev) => [...prev, task]);
      setNewTask("");
    } catch {
      setError("Couldn't add that task.");
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (task) => {
    const nextCompleted = !task.completed;

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)));

    try {
      await organizeApi.setTaskCompleted(task.id, nextCompleted);
      setSummary((prev) =>
        prev
          ? {
            ...prev,
            tasksCompletedAllTime: prev.tasksCompletedAllTime + (nextCompleted ? 1 : -1),
          }
          : prev
      );
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
      setError("Couldn't update that task.");
    }
  };

  const handleDeleteTask = async (id) => {
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await organizeApi.deleteTask(id);
    } catch {
      setTasks(prevTasks);
      setError("Couldn't delete that task.");
    }
  };

  const tasksCompletedToday = tasks.filter((t) => t.completed).length;

  return (
    <div className="page-enter min-h-screen bg-slate-950 px-6 py-16 text-white">

      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Organize
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Keep your learning organized.
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Manage your subjects and daily tasks — everything here is saved
            to your account.
          </p>
        </div>

        {error && (
          <p className="mt-6 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Overview Cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-2xl">📚</div>

            <p className="mt-4 text-sm text-slate-500">
              Active Subjects
            </p>

            <p className="mt-2 text-3xl font-bold">
              {loading ? "—" : subjects.length}
            </p>
          </div>


          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-2xl">✅</div>

            <p className="mt-4 text-sm text-slate-500">
              Tasks Completed Today
            </p>

            <p className="mt-2 text-3xl font-bold">
              {loading ? "—" : tasksCompletedToday}
            </p>
          </div>


          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-2xl">🏆</div>

            <p className="mt-4 text-sm text-slate-500">
              Completed All-Time
            </p>

            <p className="mt-2 text-3xl font-bold">
              {loading || !summary ? "—" : summary.tasksCompletedAllTime}
            </p>
          </div>

        </div>


        {/* Main Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">


          {/* Subjects */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-semibold">
                  Your Subjects
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Keep track of what you're learning.
                </p>
              </div>

            </div>

            <form onSubmit={handleAddSubject} className="mt-5 flex gap-2">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Add a subject (e.g. Networking)"
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={addingSubject || !newSubject.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                Add
              </button>
            </form>


            <div className="mt-6 space-y-3">

              {!loading && subjects.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-600">
                  No subjects yet — add one above to start tracking it.
                </p>
              )}

              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-lg">
                      {subject.icon}
                    </div>

                    <div>
                      <p className="font-medium">
                        {subject.name}
                      </p>

                      <p className="text-xs text-slate-600">
                        {subject.topicsCount} topics
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-blue-400">
                      {subject.progressPct}%
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(subject.id)}
                      aria-label={`Delete ${subject.name}`}
                      className="text-slate-700 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              ))}

            </div>

          </section>


          {/* Tasks */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-semibold">
                  Today's Tasks
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Stay on top of your daily goals.
                </p>
              </div>

            </div>

            <form onSubmit={handleAddTask} className="mt-5 space-y-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task for today"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              />

              <div className="flex gap-2">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <input
                  type="number"
                  min="5"
                  step="5"
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(e.target.value)}
                  className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />

                <span className="flex items-center text-sm text-slate-500">
                  minutes
                </span>

                <button
                  type="submit"
                  disabled={addingTask || !newTask.trim()}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </form>


            <div className="mt-6 space-y-3">

              {!loading && tasks.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-600">
                  No tasks for today yet — add one above.
                </p>
              )}

              {tasks.map((task) => {
                const timer = timers[task.id];
                const secondsLeft = timer?.secondsLeft ?? (task.durationMin || 30) * 60;
                const isRunning = !!timer?.running;
                const isDone = secondsLeft === 0;

                return (
                <div
                  key={task.id}
                  className="group flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4"
                >

                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task)}
                    className="size-4 accent-blue-600"
                  />

                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? "text-slate-500 line-through" : ""}`}>
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {task.durationMin} minutes
                    </p>
                  </div>

                  {/* Exact countdown timer */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-sm tabular-nums ${
                        isDone ? "text-emerald-400" : isRunning ? "text-blue-400" : "text-slate-400"
                      }`}
                    >
                      {formatClock(secondsLeft)}
                    </span>

                    {isRunning ? (
                      <button
                        type="button"
                        onClick={() => pauseTimer(task.id)}
                        aria-label={`Pause timer for ${task.title}`}
                        className="rounded-lg border border-slate-800 p-1.5 text-slate-400 transition hover:border-blue-500/40 hover:text-blue-400"
                      >
                        <Pause size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startTimer(task)}
                        disabled={isDone}
                        aria-label={`Start timer for ${task.title}`}
                        className="rounded-lg border border-slate-800 p-1.5 text-slate-400 transition hover:border-blue-500/40 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Play size={14} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => resetTimer(task)}
                      aria-label={`Reset timer for ${task.title}`}
                      className="rounded-lg border border-slate-800 p-1.5 text-slate-500 transition hover:border-slate-600 hover:text-slate-300"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs ${PRIORITY_STYLES[task.priority]}`}>
                    {task.priority[0].toUpperCase() + task.priority.slice(1)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                    className="text-slate-700 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>
                );
              })}

            </div>

          </section>

        </div>


        {/* Weekly summary */}
        {!loading && summary && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  This Week
                </h2>
                <p className="text-sm text-slate-500">
                  Tasks you've completed across the last 7 days.
                </p>
              </div>
            </div>

            <p className="mt-6 text-3xl font-bold">
              {summary.weekTasksCompleted}
              <span className="ml-2 text-base font-normal text-slate-500">
                / {summary.weekTasksTotal} tasks completed
              </span>
            </p>

          </section>
        )}

        {!loading && subjects.length === 0 && tasks.length === 0 && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-500">
            <BookOpen size={18} />
            Add a subject and a task above to start building your day-by-day
            organize history.
          </div>
        )}

      </div>

    </div>
  );
}

export default Organize;
