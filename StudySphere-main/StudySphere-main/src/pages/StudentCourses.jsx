import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  BookOpen,
  Clock3,
  Users,
  Star,
  Play,
  ArrowRight,
  Sparkles,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { courseApi } from "../lib/api";

function StudentCourses() {
  const [favoriteTopics, setFavoriteTopics] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  /* =====================================================
     LOAD STUDENT PROFILE
  ===================================================== */

  useEffect(() => {
    const savedProfile =
      localStorage.getItem("studentProfile");

    if (!savedProfile) return;

    try {
      const profile = JSON.parse(savedProfile);

      if (Array.isArray(profile.favoriteTopics)) {
        setFavoriteTopics(profile.favoriteTopics);
      }
    } catch (error) {
      console.error(
        "Failed to load student profile:",
        error
      );
    }
  }, []);


  /* =====================================================
     LOAD COURSES FROM THE BACKEND
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    courseApi
      .list()
      .then((data) => {
        if (!cancelled) setTeacherCourses(Array.isArray(data.courses) ? data.courses : []);
      })
      .catch((error) => {
        console.error("Failed to load courses:", error);
        if (!cancelled) setTeacherCourses([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);


  /* =====================================================
     LOAD MY ENROLLED COURSES (for enrolled flag + progress)
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    courseApi
      .myEnrolledCourses()
      .then((data) => {
        if (!cancelled) setEnrolledCourses(Array.isArray(data.courses) ? data.courses : []);
      })
      .catch((error) => {
        console.error("Failed to load enrolled courses:", error);
        if (!cancelled) setEnrolledCourses([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const enrolledIds = useMemo(
    () => enrolledCourses.map((course) => String(course.id)),
    [enrolledCourses]
  );

  const enrolledById = useMemo(() => {
    const map = new Map();
    enrolledCourses.forEach((course) => map.set(String(course.id), course));
    return map;
  }, [enrolledCourses]);


  /* =====================================================
     CONVERT TEACHER COURSES
  ===================================================== */

  const formattedTeacherCourses = useMemo(() => {
    return teacherCourses.map((course) => ({
      ...course,

      instructor:
        course.instructor ||
        "StudySphere Teacher",

      category:
        course.category ||
        "General",

      level:
        course.level ||
        "Beginner",

      description:
        course.description ||
        "Learn this course on StudySphere.",

      students:
        course.enrolledCount || 0,

      rating:
        course.rating || 0,

      progress:
        enrolledById.get(String(course.id))?.progressPct || 0,

      // Only actually-enrolled courses (from the backend) show up as
      // enrolled — not whatever the teacher happened to save on the
      // course record itself.
      enrolled:
        enrolledIds.includes(String(course.id)),

      color:
        course.color || "purple",

      duration:
        course.duration ||
        `${course.lessons?.length || 0} lessons`,

      isTeacherCourse: true,
    }));
  }, [teacherCourses, enrolledIds, enrolledById]);


  /* =====================================================
     ALL COURSES
  ===================================================== */

  const courses = formattedTeacherCourses;


  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories = useMemo(() => {
    const dynamicCategories = courses
      .map((course) => course.category)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(
        new Set(dynamicCategories)
      ),
    ];
  }, [courses]);


  /* =====================================================
     COURSE COLOR
  ===================================================== */

  const getCourseGradient = (color) => {
    const gradients = {
      blue:
        "from-blue-600/30 via-blue-500/10 to-slate-950",

      cyan:
        "from-cyan-600/30 via-cyan-500/10 to-slate-950",

      yellow:
        "from-yellow-600/30 via-yellow-500/10 to-slate-950",

      purple:
        "from-purple-600/30 via-purple-500/10 to-slate-950",

      orange:
        "from-orange-600/30 via-orange-500/10 to-slate-950",

      emerald:
        "from-emerald-600/30 via-emerald-500/10 to-slate-950",

      green:
        "from-green-600/30 via-green-500/10 to-slate-950",

      slate:
        "from-slate-600/30 via-slate-500/10 to-slate-950",
    };

    return (
      gradients[color] ||
      gradients.slate
    );
  };


  /* =====================================================
     CHECK COURSE RELEVANCE
  ===================================================== */

  const isRecommended = (course) => {
    if (!favoriteTopics.length) {
      return false;
    }

    return favoriteTopics.some((topic) => {
      const studentTopic =
        String(topic).toLowerCase().trim();

      const courseCategory =
        String(course.category || "")
          .toLowerCase();

      const courseTitle =
        String(course.title || "")
          .toLowerCase();

      const courseDescription =
        String(course.description || "")
          .toLowerCase();

      return (
        courseCategory.includes(studentTopic) ||
        studentTopic.includes(courseCategory) ||
        courseTitle.includes(studentTopic) ||
        courseDescription.includes(studentTopic)
      );
    });
  };


  /* =====================================================
     FILTER COURSES
  ===================================================== */

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const query =
        search.toLowerCase().trim();

      const matchesSearch =
        course.title
          .toLowerCase()
          .includes(query) ||
        course.category
          .toLowerCase()
          .includes(query) ||
        course.description
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        selectedCategory === "All" ||
        course.category === selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    courses,
    search,
    selectedCategory,
  ]);


  /* =====================================================
     RECOMMENDED COURSES
  ===================================================== */

  const recommendedCourses =
    courses.filter((course) =>
      isRecommended(course)
    );


  /* =====================================================
     COURSE CARD
  ===================================================== */

  const CourseCard = ({
    course,
    recommended = false,
  }) => {
    return (
      <div className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/20">

        {/* =================================================
            COURSE VISUAL
        ================================================= */}

        <div
          className={`relative h-32 overflow-hidden bg-gradient-to-br ${getCourseGradient(
            course.color
          )}`}
        >

          {/* Uploaded thumbnail, if the teacher set one */}

          {course.thumbnail && (
            <img
              src={course.thumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Decorative glow */}

          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />


          {/* Recommended */}

          {recommended && (
            <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-blue-400 backdrop-blur">
              <Sparkles size={13} />
              Recommended
            </div>
          )}


          {/* Teacher Course */}

          {course.isTeacherCourse && (
            <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-purple-400 backdrop-blur">
              Teacher Course
            </div>
          )}


          {/* Enrolled */}

          {course.enrolled && (
            <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur">
              <CheckCircle2 size={13} />
              Enrolled
            </div>
          )}


          {/* Course icon */}

          <div className="absolute bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-white/80 backdrop-blur">
            <BookOpen
              size={24}
              strokeWidth={1.7}
            />
          </div>

        </div>


        {/* =================================================
            COURSE CONTENT
        ================================================= */}

        <div className="p-5">

          {/* Category + Level */}

          <div className="flex items-center justify-between gap-3">

            <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
              {course.category}
            </span>

            <span className="text-xs text-slate-500">
              {course.level}
            </span>

          </div>


          {/* Title */}

          <h3 className="mt-4 min-h-[56px] line-clamp-2 text-xl font-semibold leading-7 text-white">
            {course.title}
          </h3>


          {/* Description */}

          <p className="mt-3 min-h-[48px] line-clamp-2 text-sm leading-6 text-slate-500">
            {course.description}
          </p>


          {/* Instructor */}

          <p className="mt-4 text-xs text-slate-600">
            By{" "}
            <span className="text-slate-400">
              {course.instructor}
            </span>
          </p>


          {/* Stats */}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">

            {course.rating > 0 && (
              <span className="flex items-center gap-1.5">
                <Star
                  size={14}
                  className="fill-yellow-400 text-yellow-400"
                />
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


          {/* Progress */}

          {course.enrolled && (
            <div className="mt-5">

              <div className="flex items-center justify-between text-xs">

                <span className="text-slate-500">
                  Your progress
                </span>

                <span className="font-medium text-blue-400">
                  {course.progress}%
                </span>

              </div>


              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">

                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${course.progress}%`,
                  }}
                />

              </div>

            </div>
          )}


          {/* Action */}

          <Link
            to={`/student/courses/${course.id}`}
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
          >

            {course.enrolled ? (
              <>
                <Play size={16} />
                Continue Learning
              </>
            ) : (
              <>
                View Course
                <ArrowRight size={16} />
              </>
            )}

          </Link>

        </div>

      </div>
    );
  };


  /* =====================================================
     PAGE
  ===================================================== */

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
                Learning
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                My Courses
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
                Continue learning, discover new courses,
                and build the skills that matter to you.
              </p>

            </div>


            {/* Available Courses */}

            <div className="min-w-[170px] rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">

              <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                Available Courses
              </p>

              <p className="mt-1 text-2xl font-bold text-white">
                {courses.length}
              </p>

            </div>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* =================================================
            CONTINUE LEARNING
        ================================================= */}

        {courses.some(
          (course) => course.enrolled
        ) && (
          <section>

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                Continue
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Pick up where you left off
              </h2>

            </div>


            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {courses
                .filter(
                  (course) => course.enrolled
                )
                .map((course) => (
                  <CourseCard
                    key={`${course.isTeacherCourse ? "teacher" : "demo"}-${course.id}`}
                    course={course}
                  />
                ))}

            </div>

          </section>
        )}


        {/* =================================================
            RECOMMENDED
        ================================================= */}

        <section className="mt-16">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>

              <div className="flex items-center gap-2">

                <Sparkles
                  size={18}
                  className="text-blue-400"
                />

                <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                  Personalized
                </p>

              </div>

              <h2 className="mt-2 text-2xl font-bold">
                Recommended for You
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Courses matched with your favorite
                topics and learning interests.
              </p>

            </div>


            {favoriteTopics.length > 0 && (
              <div className="flex flex-wrap gap-2">

                {favoriteTopics
                  .slice(0, 5)
                  .map((topic) => (
                    <span
                      key={topic}
                      className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400"
                    >
                      {topic}
                    </span>
                  ))}

              </div>
            )}

          </div>


          {recommendedCourses.length > 0 ? (

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {recommendedCourses
                .slice(0, 3)
                .map((course) => (
                  <CourseCard
                    key={`recommended-${course.isTeacherCourse ? "teacher" : "demo"}-${course.id}`}
                    course={course}
                    recommended
                  />
                ))}

            </div>

          ) : (

            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center">

              <Sparkles
                size={28}
                className="mx-auto text-slate-600"
              />

              <h3 className="mt-4 text-lg font-semibold">
                Personalize your recommendations
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Add your favorite subjects and topics
                to your profile and we'll use them to
                recommend relevant courses.
              </p>

              <Link
                to="/student/profile"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Add Favorite Topics
                <ArrowRight size={16} />
              </Link>

            </div>
          )}

        </section>


        {/* =================================================
            ALL COURSES
        ================================================= */}

        <section className="mt-16">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">
                Explore
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                All Courses
              </h2>

            </div>


            {/* Search */}

            <div className="relative w-full lg:w-80">

              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search courses..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />

            </div>

          </div>


          {/* Category Filters */}

          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">

            <Filter
              size={17}
              className="shrink-0 text-slate-600"
            />

            {categories.map((category) => (

              <button
                key={category}
                type="button"
                onClick={() =>
                  setSelectedCategory(category)
                }
                className={`shrink-0 rounded-lg px-3.5 py-2 text-sm transition ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white"
                }`}
              >
                {category}
              </button>

            ))}

          </div>


          {/* Courses */}

          {filteredCourses.length > 0 ? (

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {filteredCourses.map(
                (course) => (
                  <CourseCard
                    key={`${course.isTeacherCourse ? "teacher" : "demo"}-${course.id}`}
                    course={course}
                  />
                )
              )}

            </div>

          ) : (

            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center">

              <BookOpen
                size={30}
                className="mx-auto text-slate-600"
              />

              <h3 className="mt-4 text-lg font-semibold">
                No courses found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another search or category.
              </p>

            </div>

          )}

        </section>


        {/* =================================================
            PROFILE CTA
        ================================================= */}

        <section className="mt-20 overflow-hidden rounded-3xl border border-blue-500/10 bg-blue-500/5">

          <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">

            <div>

              <p className="text-sm font-semibold text-blue-400">
                Improve your recommendations
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Tell us what you want to learn.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Keep your favorite topics updated so
                StudySphere can personalize your learning
                journey.
              </p>

            </div>

            <Link
              to="/student/profile"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/20"
            >
              Update Interests
              <ArrowRight size={16} />
            </Link>

          </div>

        </section>

      </main>

    </div>
  );
}

export default StudentCourses;