import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    BookOpen,
    Clock3,
    MoreVertical,
    Plus,
    Trash2,
    Users,
    Edit3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { courseApi } from "../lib/api";

function TeacherCourses() {
    const { user } = useAuth();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        courseApi
            .myCourses()
            .then((data) => {
                if (!cancelled) setCourses(data.courses || []);
            })
            .catch(() => {
                if (!cancelled) setCourses([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const [openMenu, setOpenMenu] = useState(null);
    const [deleting, setDeleting] = useState(null);

    /* =====================================================
       DELETE COURSE
    ===================================================== */

    const handleDelete = async (courseId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this course?"
        );

        if (!confirmed) return;

        setDeleting(courseId);
        setOpenMenu(null);

        try {
            await courseApi.delete(courseId);
            setCourses((prev) => prev.filter((course) => course.id !== courseId));
        } catch (error) {
            console.error("Failed to delete course:", error);
            alert("Couldn't delete this course. Please try again.");
        } finally {
            setDeleting(null);
        }
    };

    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div className="page-enter min-h-screen bg-slate-950 text-white">

            {/* =================================================
          MAIN
      ================================================= */}

            <main className="mx-auto max-w-7xl px-6 pb-16 pt-24">

                {/* =================================================
            HEADER
        ================================================= */}

                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

                    <div>

                        <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">
                            TEACHER STUDIO
                        </p>

                        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                            My Courses
                        </h1>

                        <p className="mt-3 max-w-2xl text-slate-500">
                            Create, manage, and organize the courses you
                            teach on StudySphere.
                        </p>

                    </div>


                    <Link
                        to="/teacher/create-course"
                        className="inline-flex w-fit items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-purple-500"
                    >
                        <Plus size={18} />
                        Create Course
                    </Link>

                </div>


                {/* =================================================
            SUMMARY
        ================================================= */}

                <div className="mt-8 grid gap-4 sm:grid-cols-3">

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

                        <p className="text-sm text-slate-500">
                            Total Courses
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {courses.length}
                        </p>

                    </div>


                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

                        <p className="text-sm text-slate-500">
                            Total Lessons
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {courses.reduce(
                                (total, course) =>
                                    total + (course.lessons?.length || 0),
                                0
                            )}
                        </p>

                    </div>


                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

                        <p className="text-sm text-slate-500">
                            Students
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {courses.reduce(
                                (total, course) =>
                                    total + (course.enrolledCount || 0),
                                0
                            )}
                        </p>

                    </div>

                </div>


                {/* =================================================
            COURSE LIST
        ================================================= */}

                {courses.length === 0 ? (

                    loading ? (

                        <div className="mt-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-16 text-center text-sm text-slate-500">
                            Loading your courses…
                        </div>

                    ) : (

                    <div className="mt-8 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-16 text-center">

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                            <BookOpen size={30} />
                        </div>

                        <h2 className="mt-6 text-xl font-semibold">
                            No courses yet
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            You haven't created any courses yet.
                            Create your first course and start adding
                            YouTube lectures for your students.
                        </p>

                        <Link
                            to="/teacher/create-course"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
                        >
                            <Plus size={17} />
                            Create Your First Course
                        </Link>

                    </div>

                    )

                ) : (

                    <div className="mt-8 space-y-4">

                        {courses.map((course) => (

                            <div
                                key={course.id}
                                className="group relative rounded-3xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700"
                            >

                                <div className="flex flex-col gap-5 md:flex-row md:items-center">

                                    {/* Course Icon */}

                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                                        <BookOpen size={27} />
                                    </div>


                                    {/* Course Information */}

                                    <div className="min-w-0 flex-1">

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h2 className="truncate text-lg font-semibold text-white">
                                                {course.title}
                                            </h2>

                                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                                                Published
                                            </span>

                                        </div>


                                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                            {course.description ||
                                                "No course description available."}
                                        </p>


                                        {/* Meta */}

                                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">

                                            <span>
                                                {course.category || "General"}
                                            </span>

                                            <span className="flex items-center gap-1.5">
                                                <BookOpen size={13} />
                                                {course.lessons?.length || 0} lessons
                                            </span>

                                            <span className="flex items-center gap-1.5">
                                                <Users size={13} />
                                                {course.enrolledCount || 0} students
                                            </span>

                                            {course.level && (
                                                <span>
                                                    {course.level}
                                                </span>
                                            )}

                                        </div>

                                    </div>


                                    {/* Actions */}

                                    <div className="flex items-center gap-2">

                                        <Link
                                            to={`/teacher/courses/${course.id}/students`}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-purple-500/40 hover:bg-slate-900 hover:text-white"
                                        >
                                            <Users size={16} />
                                            Students
                                        </Link>

                                        <Link
                                            to={`/teacher/courses/${course.id}/manage`}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-purple-500/40 hover:bg-slate-900 hover:text-white"
                                        >
                                            Manage
                                            <ArrowRight size={17} />
                                        </Link>


                                        {/* Menu */}

                                        <div className="relative">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenMenu(
                                                        openMenu === course.id
                                                            ? null
                                                            : course.id
                                                    )
                                                }
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                                                aria-label="Course options"
                                            >
                                                <MoreVertical size={18} />
                                            </button>


                                            {openMenu === course.id && (

                                                <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl">

                                                    <button
                                                        type="button"
                                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
                                                        onClick={() =>
                                                            setOpenMenu(null)
                                                        }
                                                    >
                                                        <Edit3 size={16} />
                                                        Edit Course
                                                    </button>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(course.id)
                                                        }
                                                        disabled={deleting === course.id}
                                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                                                    >
                                                        <Trash2 size={16} />
                                                        {deleting === course.id ? "Deleting…" : "Delete Course"}
                                                    </button>

                                                </div>

                                            )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </main>

        </div>
    );
}

export default TeacherCourses;