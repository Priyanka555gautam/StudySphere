import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  BookOpen,
  Clock3,
  Users,
  Star,
  ArrowRight,
  Filter,
  GraduationCap,
  Award,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { courseApi, teacherApi, authApi } from "../lib/api";

function Explore() {
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [followedCourses, setFollowedCourses] = useState([]);
  const [topTeachers, setTopTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [currentUser, setCurrentUser] = useState(null);

  /* =====================================================
     LOAD COURSES & TOP TEACHERS FROM THE BACKEND
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    authApi.me().then(({ user: u }) => {
      if (!cancelled) {
        setCurrentUser(u);
        if (u && u.role === "student") {
          teacherApi.followedCourses().then((fc) => {
            if (!cancelled) setFollowedCourses(Array.isArray(fc) ? fc : []);
          }).catch(console.error);
        }
      }
    }).catch(() => {});

    courseApi
      .list()
      .then((data) => {
        if (!cancelled) setTeacherCourses(Array.isArray(data.courses) ? data.courses : []);
      })
      .catch((error) => {
        console.error("Failed to load courses:", error);
        if (!cancelled) setTeacherCourses([]);
      });

    courseApi
      .topTeachers()
      .then((data) => {
        if (!cancelled) setTopTeachers(Array.isArray(data.teachers) ? data.teachers : []);
      })
      .catch((error) => {
        console.error("Failed to load top teachers:", error);
        if (!cancelled) setTopTeachers([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     NORMALIZE COURSES
  ===================================================== */

  const courses = useMemo(() => {
    return teacherCourses.map((course) => ({
      ...course,
      instructor: course.instructor || "StudySphere Teacher",
      category: course.category || "General",
      level: course.level || "Beginner",
      description: course.description || "Learn this course on StudySphere.",
      students: course.enrolledCount || 0,
      rating: course.rating || 0,
      color: course.color || "purple",
      lessonsCount: Array.isArray(course.lessons) ? course.lessons.length : 0,
      duration:
        course.duration ||
        `${Array.isArray(course.lessons) ? course.lessons.length : 0} lessons`,
    }));
  }, [teacherCourses]);

  /* =====================================================
     SUBJECTS (derived from course categories)
  ===================================================== */

  const subjects = useMemo(() => {
    const dynamic = courses.map((course) => course.category).filter(Boolean);
    return ["All", ...Array.from(new Set(dynamic))];
  }, [courses]);

  /* =====================================================
     FILTERED COURSES
  ===================================================== */

  const filteredCourses = useMemo(() => {
    const query = search.toLowerCase().trim();

    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query);

      const matchesSubject =
        selectedSubject === "All" || course.category === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  }, [courses, search, selectedSubject]);

  /* =====================================================
     GRADIENT HELPER
  ===================================================== */

  const getCourseGradient = (color) => {
    const gradients = {
      blue: "from-blue-600/30 via-blue-500/10 to-slate-950",
      cyan: "from-cyan-600/30 via-cyan-500/10 to-slate-950",
      yellow: "from-yellow-600/30 via-yellow-500/10 to-slate-950",
      purple: "from-purple-600/30 via-purple-500/10 to-slate-950",
      orange: "from-orange-600/30 via-orange-500/10 to-slate-950",
      emerald: "from-emerald-600/30 via-emerald-500/10 to-slate-950",
      green: "from-green-600/30 via-green-500/10 to-slate-950",
      slate: "from-slate-600/30 via-slate-500/10 to-slate-950",
    };

    return gradients[color] || gradients.slate;
  };

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                Explore
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Discover Courses
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Browse courses published by StudySphere teachers. Anyone can
                preview a course — sign in when you're ready to enroll.
              </p>
            </div>

            <div className="min-w-[170px] rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                Courses Available
              </p>
              <p className="mt-1 text-2xl font-bold text-white">
                {courses.length}
              </p>
            </div>
          </div>

          {/* =================================================
              SEARCH + SUBJECT FILTER
          ================================================= */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses, topics, or instructors..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/70 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="relative sm:w-64">
              <Filter
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-900/70 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject} className="bg-slate-900">
                    {subject === "All" ? "All Subjects" : subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* =================================================
            COURSES FROM TEACHERS YOU FOLLOW
        ================================================= */}

        {followedCourses.length > 0 && (
          <section className="mb-12 rounded-3xl border border-blue-500/20 bg-blue-950/20 p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserCheck size={22} className="text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Courses From Teachers You Follow</h2>
                <p className="text-sm text-slate-400">Latest course offerings from your followed instructors</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {followedCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/explore/${course.id}`}
                  className="group overflow-hidden rounded-2xl border border-blue-500/30 bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-36 bg-slate-950 overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl bg-gradient-to-br from-blue-900/40 to-indigo-900/40">
                        📚
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400 font-medium">
                      {course.category || "General"}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-white line-clamp-1">{course.title}</h3>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{course.description}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                      <span>By <strong className="text-slate-200">{course.instructor}</strong></span>
                      <span className="text-blue-400 font-semibold">View Course →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* =================================================
            TOP INSTRUCTORS SECTION
        ================================================= */}

        {topTeachers.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Award size={22} className="text-yellow-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">Top Instructors</h2>
                <p className="text-sm text-slate-400">Featured educators on StudySphere with active students</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {topTeachers.map((teacher) => (
                <Link
                  key={teacher.id}
                  to={`/teachers/${teacher.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5 block"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-purple-500/30 bg-purple-500/10">
                      {teacher.avatar ? (
                        <img
                          src={teacher.avatar}
                          alt={teacher.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-purple-400 text-lg">
                          {teacher.name ? teacher.name.charAt(0).toUpperCase() : "T"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {teacher.name}
                      </h3>
                      <p className="truncate text-xs font-medium text-purple-400 mt-0.5">
                        {teacher.expertise || "Teacher"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
                        <Users size={13} className="text-blue-400" />
                        <span className="font-semibold text-slate-200">{teacher.totalStudents || 0}</span> students
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span>{teacher.coursesCount || 0} Course{teacher.coursesCount === 1 ? "" : "s"}</span>
                    <span className="text-purple-400 font-medium group-hover:underline">View Profile →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 py-24 text-center">
            <GraduationCap size={40} className="text-slate-600" />

            <h3 className="mt-5 text-xl font-semibold text-white">
              {courses.length === 0
                ? "No courses published yet"
                : "No courses match your search"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {courses.length === 0
                ? "Teachers haven't uploaded any courses yet. Check back soon."
                : "Try a different search term or subject filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/explore/${course.id}`}
                className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/20"
              >
                <div
                  className={`relative h-32 overflow-hidden bg-gradient-to-br ${getCourseGradient(
                    course.color
                  )}`}
                >
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
                  )}

                  <div
                    className={`absolute inset-0 ${
                      course.thumbnail
                        ? "bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent"
                        : ""
                    }`}
                  />

                  <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-purple-400 backdrop-blur">
                    Teacher Course
                  </div>

                  {!course.thumbnail && (
                    <div className="absolute bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-white/80 backdrop-blur">
                      <BookOpen size={24} strokeWidth={1.7} />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
                      {course.category}
                    </span>

                    <span className="text-xs text-slate-500">
                      {course.level}
                    </span>
                  </div>

                  <h3 className="mt-4 min-h-[56px] line-clamp-2 text-xl font-semibold leading-7 text-white">
                    {course.title}
                  </h3>

                  <p className="mt-3 min-h-[48px] line-clamp-2 text-sm leading-6 text-slate-500">
                    {course.description}
                  </p>

                  <p className="mt-4 text-xs text-slate-600">
                    By <span className="text-slate-400">{course.instructor}</span>
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                    {course.rating > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        {course.rating}
                      </span>
                    )}

                    <span className="flex items-center gap-1.5">
                      <Users size={14} />
                      {course.students}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock3 size={14} />
                      {course.duration}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 py-3 text-sm font-semibold text-white transition-all duration-200 group-hover:border-blue-500/40 group-hover:bg-blue-500/10 group-hover:text-blue-400">
                    View Course
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Explore;
