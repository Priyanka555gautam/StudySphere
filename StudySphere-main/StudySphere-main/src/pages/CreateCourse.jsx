import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Trash2,
  Play,
  Save,
  ImagePlus,
  X,
  AlertCircle,
} from "lucide-react";

import TeacherNavbar from "../components/teacher/TeacherNavbar";
import { useAuth } from "../context/AuthContext";
import { courseApi, ApiError } from "../lib/api";

const MAX_THUMBNAIL_BYTES = 3 * 1024 * 1024; // 3MB

function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [course, setCourse] = useState({
    title: "",
    category: "",
    level: "Beginner",
    description: "",
    thumbnail: "",
  });

  const [lessons, setLessons] = useState([
    {
      id: Date.now(),
      title: "",
      description: "",
      videoUrl: "",
      duration: "",
      taskTitle: "",
      taskInstructions: "",
    },
  ]);

  const [lessonError, setLessonError] = useState("");
  const [thumbnailError, setThumbnailError] = useState("");

  /* =====================================================
     COURSE INPUT
  ===================================================== */

  const handleCourseChange = (e) => {
    const { name, value } = e.target;

    setCourse((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     THUMBNAIL UPLOAD
  ===================================================== */

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setThumbnailError("Please upload an image file.");
      return;
    }

    if (file.size > MAX_THUMBNAIL_BYTES) {
      setThumbnailError("Image is too large. Please choose one under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setThumbnailError("");
      setCourse((prev) => ({
        ...prev,
        thumbnail: reader.result,
      }));
    };
    reader.onerror = () => {
      setThumbnailError("Couldn't read that image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const removeThumbnail = () => {
    setCourse((prev) => ({ ...prev, thumbnail: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* =====================================================
     LESSON INPUT
  ===================================================== */

  const handleLessonChange = (id, field, value) => {
    if (lessonError) setLessonError("");

    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === id
          ? {
              ...lesson,
              [field]: value,
            }
          : lesson
      )
    );
  };

  /* =====================================================
     YOUTUBE URL → VIDEO ID
  ===================================================== */

  const extractYouTubeVideoId = (url) => {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.replace(
        "www.",
        ""
      );

      // youtube.com/watch?v=VIDEO_ID
      if (
        hostname === "youtube.com" &&
        parsedUrl.pathname === "/watch"
      ) {
        return parsedUrl.searchParams.get("v");
      }

      // youtu.be/VIDEO_ID
      if (hostname === "youtu.be") {
        return parsedUrl.pathname
          .split("/")
          .filter(Boolean)[0] || null;
      }

      // youtube.com/shorts/VIDEO_ID
      if (
        hostname === "youtube.com" &&
        parsedUrl.pathname.startsWith("/shorts/")
      ) {
        return (
          parsedUrl.pathname
            .split("/")
            .filter(Boolean)[1] || null
        );
      }

      // youtube.com/embed/VIDEO_ID
      if (
        hostname === "youtube.com" &&
        parsedUrl.pathname.startsWith("/embed/")
      ) {
        return (
          parsedUrl.pathname
            .split("/")
            .filter(Boolean)[1] || null
        );
      }

      return null;
    } catch {
      return null;
    }
  };

  /* =====================================================
     LESSON COMPLETION CHECK
     (Everything except notes/description is required)
  ===================================================== */

  const isLessonComplete = (lesson) =>
    Boolean(
      lesson.title.trim() &&
        extractYouTubeVideoId(lesson.videoUrl) &&
        lesson.duration.trim()
    );

  const getLessonMissingFields = (lesson) => {
    const missing = [];
    if (!lesson.title.trim()) missing.push("title");
    if (!extractYouTubeVideoId(lesson.videoUrl))
      missing.push("a valid YouTube URL");
    if (!lesson.duration.trim()) missing.push("duration");
    return missing;
  };

  /* =====================================================
     ADD LESSON
  ===================================================== */

  const addLesson = () => {
    const lastLesson = lessons[lessons.length - 1];

    if (!isLessonComplete(lastLesson)) {
      const missing = getLessonMissingFields(lastLesson);
      setLessonError(
        `Please add ${missing.join(", ")} for Lesson ${lessons.length} before adding a new lesson.`
      );
      return;
    }

    setLessonError("");

    setLessons((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "",
        description: "",
        videoUrl: "",
        duration: "",
        taskTitle: "",
        taskInstructions: "",
      },
    ]);
  };

  /* =====================================================
     REMOVE LESSON
  ===================================================== */

  const removeLesson = (id) => {
    if (lessons.length === 1) return;

    setLessonError("");

    setLessons((prev) =>
      prev.filter((lesson) => lesson.id !== id)
    );
  };

  /* =====================================================
     SAVE COURSE
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!course.title.trim()) {
      alert("Please enter a course title.");
      return;
    }

    if (!course.category.trim()) {
      alert("Please enter a course category.");
      return;
    }

    if (!course.description.trim()) {
      alert("Please enter a course description.");
      return;
    }

    if (!course.thumbnail) {
      setThumbnailError("Please upload a course thumbnail image.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const incompleteIndex = lessons.findIndex(
      (lesson) => !isLessonComplete(lesson)
    );

    if (incompleteIndex !== -1) {
      const missing = getLessonMissingFields(
        lessons[incompleteIndex]
      );
      setLessonError(
        `Please add ${missing.join(", ")} for Lesson ${incompleteIndex + 1} before creating the course.`
      );
      return;
    }

    setSubmitting(true);

    try {
      await courseApi.create({
        title: course.title,
        category: course.category,
        level: course.level,
        description: course.description,
        thumbnail: course.thumbnail,
        lessons: lessons.map((lesson) => ({
          title: lesson.title,
          description: lesson.description,
          videoId: extractYouTubeVideoId(lesson.videoUrl),
          duration: lesson.duration,
          task: (lesson.taskTitle || "").trim() ? {
            title: lesson.taskTitle.trim(),
            instructions: (lesson.taskInstructions || "").trim(),
          } : null,
        })),
      });

      navigate("/teacher/dashboard");
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "Couldn't create the course. Please try again."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <TeacherNavbar />


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-24">

        <div className="mb-10 flex items-center gap-3">

          <div>

            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-purple-400">
              <BookOpen size={16} />
              Teacher Studio
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Create a new course
            </h1>

            <p className="mt-3 max-w-2xl text-slate-500">
              Build your course and add YouTube lectures that
              students can watch directly inside StudySphere.
            </p>

          </div>

        </div>


        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* =================================================
              COURSE INFORMATION
          ================================================= */}

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">

            <div className="mb-6">

              <h2 className="text-xl font-semibold">
                Course Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add the basic information students will see.
              </p>

            </div>


            <div className="grid gap-6 md:grid-cols-2">

              {/* Thumbnail */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Course Thumbnail <span className="text-red-400">*</span>
                </label>

                <p className="mb-3 text-xs text-slate-600">
                  This image will be shown on the course card and details page in Explore.
                </p>

                {course.thumbnail ? (
                  <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-800">
                    <img
                      src={course.thumbnail}
                      alt="Course thumbnail preview"
                      className="h-44 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/80 text-white transition hover:bg-red-500/80"
                      aria-label="Remove thumbnail"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="course-thumbnail"
                    className="flex h-44 w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-950 text-slate-500 transition hover:border-purple-500/50 hover:text-purple-400"
                  >
                    <ImagePlus size={26} />
                    <span className="text-sm font-medium">
                      Click to upload a thumbnail
                    </span>
                    <span className="text-xs text-slate-600">
                      PNG or JPG, up to 3MB
                    </span>
                  </label>
                )}

                <input
                  ref={fileInputRef}
                  id="course-thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />

                {thumbnailError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-400">
                    <AlertCircle size={13} />
                    {thumbnailError}
                  </p>
                )}

              </div>


              {/* Title */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Course Title <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  name="title"
                  value={course.title}
                  onChange={handleCourseChange}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-purple-500"
                />

              </div>


              {/* Category */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Category <span className="text-red-400">*</span>
                </label>

                <input
                  type="text"
                  name="category"
                  value={course.category}
                  onChange={handleCourseChange}
                  placeholder="e.g. Programming"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-purple-500"
                />

              </div>


              {/* Level */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Level <span className="text-red-400">*</span>
                </label>

                <select
                  name="level"
                  value={course.level}
                  onChange={handleCourseChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>

              </div>


              {/* Description */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Course Description <span className="text-red-400">*</span>
                </label>

                <textarea
                  name="description"
                  value={course.description}
                  onChange={handleCourseChange}
                  rows={5}
                  placeholder="Describe what students will learn..."
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-purple-500"
                />

              </div>

            </div>

          </section>


          {/* =================================================
              LESSONS
          ================================================= */}

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-xl font-semibold">
                  Course Lessons
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add your YouTube lectures here. Title, video URL and duration are required — notes are optional.
                </p>

              </div>


              <button
                type="button"
                onClick={addLesson}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-purple-500/40 hover:bg-slate-800 hover:text-white"
              >
                <Plus size={17} />
                Add Lesson
              </button>

            </div>

            {lessonError && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{lessonError}</span>
              </div>
            )}


            <div className="mt-8 space-y-5">

              {lessons.map((lesson, index) => (

                <div
                  key={lesson.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                >

                  {/* Lesson Header */}

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-sm font-semibold text-purple-400">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div>

                        <p className="text-sm font-semibold text-slate-200">
                          Lesson {index + 1}
                        </p>

                        <p className="text-xs text-slate-600">
                          Add lecture details
                        </p>

                      </div>

                    </div>


                    {lessons.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeLesson(lesson.id)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Remove lesson"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}

                  </div>


                  <div className="mt-6 grid gap-5 md:grid-cols-2">

                    {/* Lesson Title */}

                    <div className="md:col-span-2">

                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Lesson Title <span className="text-red-400">*</span>
                      </label>

                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) =>
                          handleLessonChange(
                            lesson.id,
                            "title",
                            e.target.value
                          )
                        }
                        placeholder="e.g. Introduction to DSA"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                      />

                    </div>


                    {/* YouTube URL */}

                    <div>

                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">

                        <Play
                          size={17}
                          className="text-red-400"
                        />

                        YouTube Lecture URL <span className="text-red-400">*</span>

                      </label>

                      <input
                        type="url"
                        value={lesson.videoUrl}
                        onChange={(e) =>
                          handleLessonChange(
                            lesson.id,
                            "videoUrl",
                            e.target.value
                          )
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                      />

                      <p className="mt-2 text-xs text-slate-600">
                        Paste the complete YouTube video URL.
                      </p>

                      {lesson.videoUrl && (
                        <div className="mt-2">

                          {extractYouTubeVideoId(
                            lesson.videoUrl
                          ) ? (
                            <p className="text-xs font-medium text-emerald-400">
                              ✓ Valid YouTube URL
                            </p>
                          ) : (
                            <p className="text-xs font-medium text-red-400">
                              ✕ Invalid YouTube URL
                            </p>
                          )}

                        </div>
                      )}

                    </div>


                    {/* Duration */}

                    <div>

                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Duration <span className="text-red-400">*</span>
                      </label>

                      <input
                        type="text"
                        value={lesson.duration}
                        onChange={(e) =>
                          handleLessonChange(
                            lesson.id,
                            "duration",
                            e.target.value
                          )
                        }
                        placeholder="e.g. 32 min"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                      />

                    </div>


                    {/* Description / Notes */}

                    <div className="md:col-span-2">

                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Lesson Notes <span className="text-slate-600">(optional)</span>
                      </label>

                      <textarea
                        value={lesson.description}
                        onChange={(e) =>
                          handleLessonChange(
                            lesson.id,
                            "description",
                            e.target.value
                          )
                        }
                        rows={3}
                        placeholder="What will students learn in this lesson?"
                        className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                      />

                    </div>


                    {/* Lesson Task / Assignment */}

                    <div className="md:col-span-2 mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">

                      <div className="flex items-center gap-2 mb-3">

                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                          Lesson Task / Assignment
                        </span>

                        <span className="text-xs text-slate-500">
                          (Student must submit answer as PDF)
                        </span>

                      </div>


                      <div className="space-y-3">

                        <div>

                          <label className="mb-1 block text-xs font-medium text-slate-300">
                            Task Title
                          </label>

                          <input
                            type="text"
                            value={lesson.taskTitle || ""}
                            onChange={(e) =>
                              handleLessonChange(
                                lesson.id,
                                "taskTitle",
                                e.target.value
                              )
                            }
                            placeholder="e.g. Solve Practice Problems Set 1"
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                          />

                        </div>


                        <div>

                          <label className="mb-1 block text-xs font-medium text-slate-300">
                            Instructions
                          </label>

                          <textarea
                            value={lesson.taskInstructions || ""}
                            onChange={(e) =>
                              handleLessonChange(
                                lesson.id,
                                "taskInstructions",
                                e.target.value
                              )
                            }
                            rows={2}
                            placeholder="Instructions for students submitting their PDF..."
                            className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                          />

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </section>


          {/* =================================================
              CREATE COURSE
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                navigate("/teacher/dashboard")
              }
              className="rounded-xl border border-slate-800 px-6 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              <Save size={17} />
              Create Course
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}

export default CreateCourse;
