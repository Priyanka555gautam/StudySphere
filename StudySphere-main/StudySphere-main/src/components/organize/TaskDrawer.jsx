import { useState, useEffect } from "react";
import { organizeApi } from "../../lib/api";
import {
  X,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  BookOpen,
  CheckSquare,
  Sparkles,
} from "lucide-react";

export default function TaskDrawer({ open, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        organizeApi.listTasks(),
        organizeApi.listSubjects(),
      ]);
      setTasks(Array.isArray(tasksRes.tasks) ? tasksRes.tasks : []);
      setSubjects(Array.isArray(subjectsRes.subjects) ? subjectsRes.subjects : []);
    } catch (err) {
      console.error("Failed to load task drawer data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await organizeApi.createTask({
        title: newTaskTitle.trim(),
        subjectId: selectedSubjectId || null,
        dueDate: new Date().toISOString().split("T")[0],
      });
      if (res.task) {
        setTasks((prev) => [res.task, ...prev]);
        setNewTaskTitle("");
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleToggleTask = async (id, currentStatus) => {
    try {
      await organizeApi.setTaskCompleted(id, !currentStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !currentStatus } : t))
      );
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await organizeApi.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      const res = await organizeApi.createSubject({
        name: newSubjectName.trim(),
        color: "blue",
      });
      if (res.subject) {
        setSubjects((prev) => [...prev, res.subject]);
        setSelectedSubjectId(res.subject.id);
        setNewSubjectName("");
        setShowAddSubject(false);
      }
    } catch (err) {
      console.error("Failed to add subject:", err);
    }
  };

  if (!open) return null;

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 p-6 shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <CheckSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">To-Do List & Tasks</h2>
              <p className="text-xs text-slate-400">
                {completedCount} of {tasks.length} tasks completed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Task Input Form */}
        <form onSubmit={handleAddTask} className="mt-6 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500/50"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Subject Selector & Add Subject button */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 py-1.5 px-3 text-slate-300 outline-none"
            >
              <option value="">General Task</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAddSubject(!showAddSubject)}
              className="text-blue-400 hover:underline text-xs"
            >
              {showAddSubject ? "Cancel" : "+ New Subject"}
            </button>
          </div>

          {showAddSubject && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Subject name (e.g. Physics)"
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 py-1.5 px-3 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubject}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Add
              </button>
            </div>
          )}
        </form>

        {/* Task List */}
        <div className="mt-6 flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-center py-10 text-xs text-slate-500">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles size={32} className="text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-400">All caught up!</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                Add a to-do item above to keep track of your daily study goals.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                  task.completed
                    ? "border-slate-800/50 bg-slate-900/30 text-slate-500"
                    : "border-slate-800 bg-slate-900/70 text-slate-200 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    className="shrink-0 text-slate-400 transition hover:text-blue-400"
                  >
                    {task.completed ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>

                  <span
                    className={`truncate text-sm font-medium ${
                      task.completed ? "line-through text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
