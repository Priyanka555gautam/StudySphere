import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseApi } from "../../lib/api";
import {
  X,
  ClipboardList,
  BookOpen,
  ChevronRight,
  Sparkles,
} from "lucide-react";

// Popup shown from the Teacher Dashboard's "Review Assignments" card.
// It lists, course-wise, how many lesson-task submissions are still
// awaiting review. Picking a course takes the teacher straight into
// the Teacher Studio (teacher/students) view for that course, where
// the full student + lesson breakdown lives.
export default function ReviewAssignmentsDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Close on Escape for keyboard/accessibility friendliness.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await courseApi.allStudents();
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (err) {
      console.error("Failed to load pending assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group every submission that's still awaiting review ("submitted")
  // by course, so the teacher sees "which courses need my attention"
  // instead of a flat wall of individual submissions.
  const pendingByCourse = useMemo(() => {
    const map = new Map();

    students.forEach((student) => {
      if (!Array.isArray(student.submissions)) return;

      student.submissions.forEach((sub) => {
        if (sub.status !== "submitted") return;

        if (!map.has(sub.courseId)) {
          map.set(sub.courseId, {
            courseId: sub.courseId,
            courseTitle: sub.courseTitle,
            count: 0,
            studentNames: new Set(),
          });
        }

        const entry = map.get(sub.courseId);
        entry.count += 1;
        entry.studentNames.add(student.name);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [students]);

  const totalPending = pendingByCourse.reduce((sum, c) => sum + c.count, 0);

  const goToCourse = (courseId) => {
    onClose();
    navigate(`/teacher/courses/${courseId}/students`);
  };

  if (!open) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pending assignments to review"
    >
      <div
        className="modal-pop flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pending Reviews</h2>
              <p className="text-xs text-slate-400">
                {totalPending} assignment{totalPending === 1 ? "" : "s"} waiting across{" "}
                {pendingByCourse.length} course{pendingByCourse.length === 1 ? "" : "s"}
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

        {/* Course-wise pending list */}
        <div className="mt-5 flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <p className="text-center py-12 text-xs text-slate-500">
              Loading pending assignments...
            </p>
          ) : pendingByCourse.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles size={36} className="text-slate-700 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">All caught up</h3>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                No lesson task submissions are waiting on your review right now.
              </p>
            </div>
          ) : (
            pendingByCourse.map((course) => (
              <button
                key={course.courseId}
                type="button"
                onClick={() => goToCourse(course.courseId)}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-left transition hover:border-purple-500/40 hover:bg-slate-900"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <BookOpen size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">
                    {course.courseTitle}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {course.studentNames.size} student{course.studentNames.size === 1 ? "" : "s"} with work to review
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400">
                  {course.count} pending
                </span>

                <ChevronRight size={18} className="shrink-0 text-slate-600" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
