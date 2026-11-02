import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Lock,
  ThumbsDown,
  ThumbsUp,
  Users,
  XCircle,
} from "lucide-react";

import TeacherNavbar from "../components/teacher/TeacherNavbar";
import { courseApi, ApiError, openBase64Pdf } from "../lib/api";

const STATUS_STYLES = {
  locked: { label: "Locked", className: "bg-slate-800 text-slate-500", icon: Lock },
  pending: { label: "Not submitted", className: "bg-slate-800 text-slate-400", icon: Clock3 },
  submitted: { label: "Awaiting review", className: "bg-amber-500/10 text-amber-400", icon: FileText },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Changes requested", className: "bg-red-500/10 text-red-400", icon: XCircle },
};

function TeacherCourseStudents() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // { [submissionId]: { remark, submitting, error } }
  const [evalDrafts, setEvalDrafts] = useState({});

  const load = () => {
    setLoading(true);
    courseApi
      .courseStudents(courseId)
      .then((data) => {
        setCourse(data.course);
        setStudents(data.students || []);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load this course.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const setDraft = (submissionId, patch) => {
    setEvalDrafts((prev) => ({
      ...prev,
      [submissionId]: { remark: "", ...prev[submissionId], ...patch },
    }));
  };

  const handleEvaluate = async (submissionId, status) => {
    const draft = evalDrafts[submissionId] || { remark: "" };
    const remark = (draft.remark || "").trim();

    if (!remark) {
      setDraft(submissionId, { error: "Add a remark for the student before submitting." });
      return;
    }

    setDraft(submissionId, { submitting: true, error: "" });

    try {
      await courseApi.evaluateSubmission(submissionId, { status, remark });
      load();
    } catch (err) {
      setDraft(submissionId, {
        submitting: false,
        error: err instanceof ApiError ? err.message : "Couldn't save that evaluation.",
      });
    }
  };

  const openPdf = (fileName, fileData) => openBase64Pdf(fileName, fileData);

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">
      <TeacherNavbar />

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-24">
        <Link
          to="/teacher/students"
          className="flex w-fit items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Students
        </Link>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-16 text-center text-sm text-slate-500">
            Loading…
          </div>
        ) : error ? (
          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center text-sm text-red-400">
            {error}
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                <BookOpen size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{course?.title}</h1>
                <p className="text-sm text-slate-500">
                  {students.length} student{students.length === 1 ? "" : "s"} enrolled
                </p>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
                <Users size={30} className="mx-auto text-slate-700" />
                <h2 className="mt-4 text-lg font-semibold">No students yet</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Once a student enrolls in this course, they'll show up
                  here with their lesson task submissions.
                </p>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {students.map((student) => (
                  <div
                    key={student.enrollmentId}
                    className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{student.studentName}</p>
                          {student.studentClass && (
                            <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-300">
                              {student.studentClass}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{student.studentEmail}</p>
                      </div>
                      <p className="text-xs text-slate-600">
                        Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {student.lessons.map((lesson, index) => {
                        const style = STATUS_STYLES[lesson.status] || STATUS_STYLES.pending;
                        const Icon = style.icon;
                        const draft = evalDrafts[lesson.submissionId] || { remark: "" };

                        return (
                          <div
                            key={lesson.lessonId}
                            className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-200">
                                {index + 1}. {lesson.lessonTitle}
                              </p>

                              <span
                                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${style.className}`}
                              >
                                <Icon size={13} />
                                {style.label}
                              </span>
                            </div>

                            {lesson.fileName && (
                              <button
                                type="button"
                                onClick={() => openPdf(lesson.fileName, lesson.fileData)}
                                className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300"
                              >
                                <FileText size={14} />
                                View {lesson.fileName}
                              </button>
                            )}

                            {lesson.status === "submitted" && (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  value={draft.remark}
                                  onChange={(e) =>
                                    setDraft(lesson.submissionId, { remark: e.target.value, error: "" })
                                  }
                                  placeholder="Write a remark for the student…"
                                  rows={2}
                                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
                                />

                                {draft.error && (
                                  <p className="text-xs text-red-400">{draft.error}</p>
                                )}

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={draft.submitting}
                                    onClick={() => handleEvaluate(lesson.submissionId, "approved")}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                                  >
                                    <ThumbsUp size={14} />
                                    Approve & unlock next lesson
                                  </button>

                                  <button
                                    type="button"
                                    disabled={draft.submitting}
                                    onClick={() => handleEvaluate(lesson.submissionId, "rejected")}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                                  >
                                    <ThumbsDown size={14} />
                                    Request changes
                                  </button>
                                </div>
                              </div>
                            )}

                            {(lesson.status === "approved" || lesson.status === "rejected") &&
                              lesson.remark && (
                                <p className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs text-slate-400">
                                  <span className="font-medium text-slate-300">Your remark: </span>
                                  {lesson.remark}
                                </p>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default TeacherCourseStudents;
