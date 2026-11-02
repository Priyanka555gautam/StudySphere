import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users } from "lucide-react";

import TeacherNavbar from "../components/teacher/TeacherNavbar";
import { courseApi } from "../lib/api";

function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    courseApi
      .allStudents()
      .then((data) => {
        if (!cancelled) setStudents(data.students || []);
      })
      .catch(() => {
        if (!cancelled) setStudents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Group the flat roster by course so it reads as "this course, these
  // students" — the shape a teacher actually wants when managing the
  // teacher/student relationship per course.
  const byCourse = useMemo(() => {
    const map = new Map();

    for (const row of students) {
      if (!map.has(row.courseId)) {
        map.set(row.courseId, { courseId: row.courseId, courseTitle: row.courseTitle, students: [] });
      }
      map.get(row.courseId).students.push(row);
    }

    return Array.from(map.values());
  }, [students]);

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">
      <TeacherNavbar />

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">
          TEACHER STUDIO
        </p>

        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Students</h1>

        <p className="mt-3 max-w-2xl text-slate-500">
          Everyone enrolled across your courses, grouped by course. Open a
          course to review lesson task submissions and evaluate them.
        </p>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-16 text-center text-sm text-slate-500">
            Loading your students…
          </div>
        ) : byCourse.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
              <Users size={30} />
            </div>

            <h2 className="mt-6 text-xl font-semibold">No students yet</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Once students enroll in one of your courses, they'll show up
              here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {byCourse.map((group) => (
              <div
                key={group.courseId}
                className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <BookOpen size={20} />
                    </div>

                    <div>
                      <h2 className="font-semibold">{group.courseTitle}</h2>
                      <p className="text-xs text-slate-500">
                        {group.students.length} student
                        {group.students.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/teacher/courses/${group.courseId}/students`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-purple-500/40 hover:text-white"
                  >
                    Review submissions
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="mt-4 divide-y divide-slate-800/80">
                  {group.students.map((student) => (
                    <div
                      key={student.enrollmentId}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-200">
                            {student.studentName}
                          </p>
                          {student.studentClass && (
                            <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-300">
                              {student.studentClass}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {student.studentEmail}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600">
                        Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherStudents;
