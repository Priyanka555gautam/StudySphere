import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  Play,
  FileText,
  Save,
  ExternalLink,
  ClipboardList,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { courseApi, ApiError, openBase64Pdf } from "../lib/api";

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

function ManageCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  // Per-lesson DPP/task editor drafts, keyed by lesson id: { title,
  // instructions, file, saving, error }. Separate from `course` state so
  // typing in a task field never touches the lesson-save flow.
  const [taskDrafts, setTaskDrafts] = useState({});

  /* =====================================================
     LOAD COURSE
  ===================================================== */

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    courseApi
      .get(courseId)
      .then((data) => {
        if (cancelled) return;

        const foundCourse = data.course;

        // Don't let a teacher manage a course that belongs to a
        // different teacher account.
        if (!foundCourse || foundCourse.teacherId !== user?.id) {
          setCourse(null);
          setLoadError("");
          return;
        }

        setCourse({
          ...foundCourse,
          lessons: Array.isArray(foundCourse.lessons)
            ? foundCourse.lessons.map((lesson, index) => ({
                ...lesson,
                id: lesson.id ?? index + 1,
                title: lesson.title || "",
                description: lesson.description || "",
                duration: lesson.duration || "",
                videoId: lesson.videoId || "",
                videoUrl: lesson.videoId
                  ? `https://www.youtube.com/watch?v=${lesson.videoId}`
                  : "",
                materials: Array.isArray(lesson.materials) ? lesson.materials : [],
              }))
            : [],
        });

        setTaskDrafts((prev) => {
          const next = { ...prev };
          (foundCourse.lessons || []).forEach((lesson) => {
            if (next[lesson.id]) return; // don't clobber an in-progress edit
            next[lesson.id] = {
              title: lesson.task?.title || "",
              instructions: lesson.task?.instructions || "",
              fileName: lesson.task?.fileName || "",
              file: null,
              saving: false,
              error: "",
            };
          });
          return next;
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setCourse(null);
          setLoadError(error instanceof ApiError ? error.message : "Couldn't load this course.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, user?.id]);


  /* =====================================================
     COURSE INPUT
  ===================================================== */

  const handleCourseChange = (
    field,
    value
  ) => {
    setCourse((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  /* =====================================================
     YOUTUBE URL → VIDEO ID
  ===================================================== */

  const extractYouTubeVideoId = (url) => {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url);

      const hostname =
        parsedUrl.hostname.replace(
          "www.",
          ""
        );

      /* youtube.com/watch?v= */

      if (
        hostname === "youtube.com" &&
        parsedUrl.pathname === "/watch"
      ) {
        return (
          parsedUrl.searchParams.get("v") ||
          null
        );
      }

      /* youtu.be/VIDEO_ID */

      if (
        hostname === "youtu.be"
      ) {
        return (
          parsedUrl.pathname
            .split("/")
            .filter(Boolean)[0] ||
          null
        );
      }

      /* youtube.com/shorts/VIDEO_ID */

      if (
        hostname === "youtube.com" &&
        parsedUrl.pathname.startsWith(
          "/shorts/"
        )
      ) {
        return (
          parsedUrl.pathname
            .split("/")
            .filter(Boolean)[1] ||
          null
        );
      }

      /* youtube.com/embed/VIDEO_ID */

      if (
        hostname === "youtube.com" &&
        parsedUrl.pathname.startsWith(
          "/embed/"
        )
      ) {
        return (
          parsedUrl.pathname
            .split("/")
            .filter(Boolean)[1] ||
          null
        );
      }

      return null;
    } catch {
      return null;
    }
  };


  /* =====================================================
     ADD LESSON
  ===================================================== */

  const addLesson = () => {
    setCourse((prev) => ({
      ...prev,

      lessons: [
        ...prev.lessons,

        {
          id: Date.now(),
          title: "",
          description: "",
          duration: "",
          videoId: "",
          videoUrl: "",
          materials: [],
        },
      ],
    }));
  };


  /* =====================================================
     DELETE LESSON
  ===================================================== */

  const deleteLesson = (lessonId) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this lesson?"
      );

    if (!confirmed) return;

    setCourse((prev) => ({
      ...prev,

      lessons:
        prev.lessons.filter(
          (lesson) =>
            lesson.id !== lessonId
        ),
    }));
  };


  /* =====================================================
     LESSON INPUT
  ===================================================== */

  const updateLesson = (
    lessonId,
    field,
    value
  ) => {
    setCourse((prev) => ({
      ...prev,

      lessons: prev.lessons.map(
        (lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                [field]: value,
              }
            : lesson
      ),
    }));
  };


  /* =====================================================
     ADD PDF / NOTE
  ===================================================== */

  const addMaterial = (
    lessonId
  ) => {
    setCourse((prev) => ({
      ...prev,

      lessons: prev.lessons.map(
        (lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,

                materials: [
                  ...(lesson.materials ||
                    []),

                  {
                    id: Date.now(),
                    name: "",
                    pdfUrl: "",
                  },
                ],
              }
            : lesson
      ),
    }));
  };


  /* =====================================================
     UPDATE PDF / NOTE
  ===================================================== */

  const updateMaterial = (
    lessonId,
    materialId,
    field,
    value
  ) => {
    setCourse((prev) => ({
      ...prev,

      lessons: prev.lessons.map(
        (lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,

                materials:
                  lesson.materials.map(
                    (material) =>
                      material.id ===
                      materialId
                        ? {
                            ...material,
                            [field]:
                              value,
                          }
                        : material
                  ),
              }
            : lesson
      ),
    }));
  };


  /* =====================================================
     DELETE PDF / NOTE
  ===================================================== */

  const deleteMaterial = (
    lessonId,
    materialId
  ) => {
    setCourse((prev) => ({
      ...prev,

      lessons: prev.lessons.map(
        (lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,

                materials:
                  lesson.materials.filter(
                    (material) =>
                      material.id !==
                      materialId
                  ),
              }
            : lesson
      ),
    }));
  };


  /* =====================================================
     LESSON TASK ("DPP") — separate from Notes/materials.
     Only lessons with a real (string) id — i.e. already saved at
     least once — can have a task attached, since the task is stored
     against the lesson's server-side row.
  ===================================================== */

  const updateTaskDraft = (lessonId, patch) => {
    setTaskDrafts((prev) => ({
      ...prev,
      [lessonId]: { ...(prev[lessonId] || { title: "", instructions: "", fileName: "" }), ...patch },
    }));
  };

  const handleTaskFileChange = (lessonId, e) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== "application/pdf") {
      updateTaskDraft(lessonId, { error: "The task attachment must be a PDF." });
      return;
    }
    updateTaskDraft(lessonId, { file, error: "" });
  };

  const saveLessonTask = async (lessonId) => {
    const draft = taskDrafts[lessonId] || {};
    const title = (draft.title || "").trim();

    if (!title) {
      updateTaskDraft(lessonId, { error: "Give the task a title first." });
      return;
    }

    updateTaskDraft(lessonId, { saving: true, error: "" });

    try {
      let fileName = draft.fileName || undefined;
      let fileData;
      if (draft.file) {
        fileData = await readFileAsBase64(draft.file);
        fileName = draft.file.name;
      }

      const { task } = await courseApi.saveLessonTask(courseId, lessonId, {
        title,
        instructions: draft.instructions || "",
        ...(fileData ? { fileName, fileData } : {}),
      });

      updateTaskDraft(lessonId, {
        saving: false,
        file: null,
        fileName: task.fileName || fileName || "",
      });

      setCourse((prev) => ({
        ...prev,
        lessons: prev.lessons.map((l) => (l.id === lessonId ? { ...l, task } : l)),
      }));
    } catch (error) {
      updateTaskDraft(lessonId, {
        saving: false,
        error: error instanceof ApiError ? error.message : "Couldn't save this task.",
      });
    }
  };

  const removeLessonTask = async (lessonId) => {
    const confirmed = window.confirm("Remove this lesson's task? Students will no longer see it.");
    if (!confirmed) return;

    try {
      await courseApi.deleteLessonTask(courseId, lessonId);
      updateTaskDraft(lessonId, { title: "", instructions: "", fileName: "", file: null, error: "" });
      setCourse((prev) => ({
        ...prev,
        lessons: prev.lessons.map((l) => (l.id === lessonId ? { ...l, task: null } : l)),
      }));
    } catch (error) {
      updateTaskDraft(lessonId, {
        error: error instanceof ApiError ? error.message : "Couldn't remove this task.",
      });
    }
  };

  const viewLessonTaskPdf = async (lessonId) => {
    try {
      const { task } = await courseApi.getLessonTask(courseId, lessonId);
      if (task?.fileData) openBase64Pdf(task.fileName, task.fileData);
    } catch {
      updateTaskDraft(lessonId, { error: "Couldn't open that PDF." });
    }
  };

  const handleSave = async () => {
    if (!course) return;

    /* Validate lessons */

    for (const lesson of course.lessons) {
      if (!lesson.title.trim()) {
        alert(
          "Every lesson must have a title."
        );
        return;
      }

      if (lesson.videoId) {
        continue;
      }

      const videoUrl =
        lesson.videoUrl || "";

      if (videoUrl.trim()) {
        const extractedId =
          extractYouTubeVideoId(
            videoUrl
          );

        if (!extractedId) {
          alert(
            `Invalid YouTube URL in "${lesson.title}".`
          );
          return;
        }
      }
    }


    /* Convert URLs to IDs */

    const updatedLessons =
      course.lessons.map(
        (lesson) => {

          const extractedId =
            extractYouTubeVideoId(
              lesson.videoUrl
            );

          return {
            ...lesson,

            videoId:
              extractedId ||
              lesson.videoId ||
              "",

            videoUrl:
              lesson.videoUrl || "",

            materials:
              Array.isArray(
                lesson.materials
              )
                ? lesson.materials.filter(
                    (material) =>
                      material.name?.trim() ||
                      material.pdfUrl?.trim()
                  )
                : [],
          };
        }
      );

    setSaving(true);

    try {
      const { course: savedCourse } = await courseApi.update(courseId, {
        title: course.title,
        category: course.category,
        level: course.level,
        description: course.description,
        thumbnail: course.thumbnail,
        lessons: updatedLessons.map((lesson) => ({
          // Only a real, previously-saved lesson has a string id. Sending
          // it back is what lets the backend match this lesson to its
          // existing row instead of deleting it and creating a new one —
          // otherwise every save would wipe that lesson's DPP task,
          // student submissions, and completion progress.
          id: typeof lesson.id === "string" ? lesson.id : undefined,
          title: lesson.title,
          description: lesson.description,
          videoId: lesson.videoId,
          duration: lesson.duration,
        })),
      });

      setCourse({
        ...savedCourse,
        lessons: savedCourse.lessons.map((lesson, index) => ({
          ...lesson,
          videoUrl: lesson.videoId ? `https://www.youtube.com/watch?v=${lesson.videoId}` : "",
          materials: updatedLessons[index]?.materials || [],
        })),
      });

      alert("Course updated successfully!");
    } catch (error) {
      alert(
        error instanceof ApiError
          ? error.message
          : "Couldn't save this course. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-500">
          Loading course...
        </p>
      </div>
    );
  }


  /* =====================================================
     COURSE NOT FOUND
  ===================================================== */

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">

        <div className="text-center">

          <BookOpen
            size={40}
            className="mx-auto text-slate-600"
          />

          <h1 className="mt-5 text-2xl font-bold">
            Course not found
          </h1>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/teacher/dashboard"
              )
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

        </div>

      </div>
    );
  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/teacher/dashboard"
              )
            }
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>


          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? "Saving…" : "Save Changes"}
          </button>

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* =================================================
            COURSE HEADER
        ================================================= */}

        <div className="mb-10">

          <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">
            Teacher Studio
          </p>

          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Manage Course
          </h1>

          <p className="mt-3 text-slate-500">
            Manage your course information, lectures,
            and study materials.
          </p>

        </div>


        {/* =================================================
            COURSE INFORMATION
        ================================================= */}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">

          <div className="mb-6">

            <h2 className="text-xl font-semibold">
              Course Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update the information students see.
            </p>

          </div>


          <div className="grid gap-5 md:grid-cols-2">

            {/* Course Title */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Course Title
              </label>

              <input
                type="text"
                value={course.title || ""}
                onChange={(e) =>
                  handleCourseChange(
                    "title",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
              />

            </div>


            {/* Category */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Category
              </label>

              <input
                type="text"
                value={course.category || ""}
                onChange={(e) =>
                  handleCourseChange(
                    "category",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
              />

            </div>


            {/* Level */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Level
              </label>

              <select
                value={
                  course.level ||
                  "Beginner"
                }
                onChange={(e) =>
                  handleCourseChange(
                    "level",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
              >
                <option>
                  Beginner
                </option>
                <option>
                  Intermediate
                </option>
                <option>
                  Advanced
                </option>
              </select>

            </div>


            {/* Description */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Description
              </label>

              <textarea
                rows={4}
                value={
                  course.description ||
                  ""
                }
                onChange={(e) =>
                  handleCourseChange(
                    "description",
                    e.target.value
                  )
                }
                className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
              />

            </div>

          </div>

        </section>


        {/* =================================================
            LESSONS
        ================================================= */}

        <section className="mt-8">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">
                Content
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Course Lessons
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add lectures and notes for each lesson.
              </p>

            </div>


            <button
              type="button"
              onClick={addLesson}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-purple-500/40 hover:bg-slate-800 hover:text-white"
            >
              <Plus size={17} />
              Add Lesson
            </button>

          </div>


          {/* =================================================
              LESSON LIST
          ================================================= */}

          <div className="mt-6 space-y-6">

            {course.lessons.map(
              (lesson, index) => (

                <article
                  key={lesson.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60"
                >

                  {/* Lesson Header */}

                  <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-sm font-bold text-purple-400">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div>

                        <p className="font-semibold text-white">
                          Lesson {index + 1}
                        </p>

                        <p className="text-xs text-slate-600">
                          Lecture & study material
                        </p>

                      </div>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        deleteLesson(
                          lesson.id
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Delete lesson"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>


                  <div className="p-5 md:p-6">

                    {/* =================================================
                        LESSON BASIC INFORMATION
                    ================================================= */}

                    <div className="grid gap-5 md:grid-cols-2">

                      {/* Title */}

                      <div className="md:col-span-2">

                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Lesson Title
                        </label>

                        <input
                          type="text"
                          value={
                            lesson.title
                          }
                          onChange={(e) =>
                            updateLesson(
                              lesson.id,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="e.g. Introduction to React"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />

                      </div>


                      {/* YouTube URL */}

                      <div>

                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">

                          <Play
                            size={17}
                            className="text-red-400"
                          />

                          YouTube Lecture URL

                        </label>

                        <input
                          type="url"
                          value={
                            lesson.videoUrl ||
                            ""
                          }
                          onChange={(e) =>
                            updateLesson(
                              lesson.id,
                              "videoUrl",
                              e.target.value
                            )
                          }
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />


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

                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">

                          <ClockIcon />

                          Duration

                        </label>

                        <input
                          type="text"
                          value={
                            lesson.duration ||
                            ""
                          }
                          onChange={(e) =>
                            updateLesson(
                              lesson.id,
                              "duration",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 25 min"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />

                      </div>


                      {/* Description */}

                      <div className="md:col-span-2">

                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Lesson Description
                        </label>

                        <textarea
                          rows={3}
                          value={
                            lesson.description ||
                            ""
                          }
                          onChange={(e) =>
                            updateLesson(
                              lesson.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Explain what students will learn in this lesson..."
                          className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />

                      </div>

                    </div>


                    {/* =================================================
                        NOTES / PDF SECTION
                    ================================================= */}

                    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">

                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                        <div>

                          <div className="flex items-center gap-2">

                            <FileText
                              size={19}
                              className="text-blue-400"
                            />

                            <h3 className="font-semibold text-white">
                              Notes / Study Material
                            </h3>

                          </div>

                          <p className="mt-1 text-xs text-slate-600">
                            Add PDFs related specifically to this lesson.
                          </p>

                        </div>


                        <button
                          type="button"
                          onClick={() =>
                            addMaterial(
                              lesson.id
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-blue-500/30 hover:bg-slate-800 hover:text-white"
                        >
                          <Plus size={15} />
                          Add Notes / PDF
                        </button>

                      </div>


                      {/* Materials */}

                      {lesson.materials?.length >
                      0 ? (

                        <div className="mt-5 space-y-3">

                          {lesson.materials.map(
                            (
                              material,
                              materialIndex
                            ) => (

                              <div
                                key={
                                  material.id
                                }
                                className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                              >

                                <div className="flex items-center justify-between">

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                                      <FileText
                                        size={
                                          18
                                        }
                                      />
                                    </div>

                                    <p className="text-sm font-medium text-slate-300">
                                      Material{" "}
                                      {materialIndex +
                                        1}
                                    </p>

                                  </div>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteMaterial(
                                        lesson.id,
                                        material.id
                                      )
                                    }
                                    className="text-slate-600 transition hover:text-red-400"
                                  >
                                    <Trash2
                                      size={
                                        16
                                      }
                                    />
                                  </button>

                                </div>


                                <div className="mt-4 grid gap-4 md:grid-cols-2">

                                  {/* Name */}

                                  <div>

                                    <label className="mb-2 block text-xs font-medium text-slate-500">
                                      Notes Name
                                    </label>

                                    <input
                                      type="text"
                                      value={
                                        material.name ||
                                        ""
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateMaterial(
                                          lesson.id,
                                          material.id,
                                          "name",
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                      placeholder="e.g. React Introduction Notes"
                                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500"
                                    />

                                  </div>


                                  {/* PDF URL */}

                                  <div>

                                    <label className="mb-2 block text-xs font-medium text-slate-500">
                                      PDF URL
                                    </label>

                                    <input
                                      type="url"
                                      value={
                                        material.pdfUrl ||
                                        ""
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        updateMaterial(
                                          lesson.id,
                                          material.id,
                                          "pdfUrl",
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                      placeholder="https://example.com/notes.pdf"
                                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500"
                                    />

                                  </div>

                                </div>


                                {/* Preview Link */}

                                {material.pdfUrl && (

                                  <a
                                    href={
                                      material.pdfUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                                  >
                                    <ExternalLink
                                      size={
                                        13
                                      }
                                    />

                                    Preview PDF

                                  </a>

                                )}

                              </div>

                            )
                          )}

                        </div>

                      ) : (

                        <div className="mt-5 rounded-xl border border-dashed border-slate-800 px-5 py-7 text-center">

                          <FileText
                            size={24}
                            className="mx-auto text-slate-700"
                          />

                          <p className="mt-3 text-sm text-slate-500">
                            No notes added yet.
                          </p>

                          <p className="mt-1 text-xs text-slate-700">
                            Add lecture notes, assignments, or study material.
                          </p>

                        </div>

                      )}

                    </div>


                    {/* =================================================
                        LESSON TASK ("DPP") SECTION
                    ================================================= */}

                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">

                      <div className="flex items-center gap-2">
                        <ClipboardList size={19} className="text-emerald-400" />
                        <h3 className="font-semibold text-white">Lesson Task (DPP)</h3>
                      </div>

                      <p className="mt-1 text-xs text-slate-600">
                        Assign a task for this lesson — students see it in their Tasks section
                        right away, complete it whenever they like, and send back a PDF for you
                        to review. It never blocks them from moving to the next lesson.
                      </p>

                      {typeof lesson.id !== "string" ? (
                        <p className="mt-4 rounded-xl border border-dashed border-slate-800 px-4 py-3 text-xs text-slate-500">
                          Save this lesson first — you can add its task once it's been created.
                        </p>
                      ) : (
                        (() => {
                          const draft = taskDrafts[lesson.id] || { title: "", instructions: "", fileName: "" };
                          const hasExisting = !!lesson.task;

                          return (
                            <div className="mt-4 space-y-3">
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                  Task Title
                                </label>
                                <input
                                  type="text"
                                  value={draft.title}
                                  onChange={(e) => updateTaskDraft(lesson.id, { title: e.target.value, error: "" })}
                                  placeholder="e.g. Basic Mathematics DPP"
                                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                  Instructions (optional)
                                </label>
                                <textarea
                                  rows={2}
                                  value={draft.instructions}
                                  onChange={(e) => updateTaskDraft(lesson.id, { instructions: e.target.value, error: "" })}
                                  placeholder="What should students do for this task?"
                                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                  Attach the task PDF (optional)
                                </label>
                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-400 transition hover:border-emerald-500/40">
                                  <UploadCloud size={16} className="shrink-0 text-emerald-400" />
                                  <span className="min-w-0 flex-1 truncate">
                                    {draft.file?.name || draft.fileName || "Choose a PDF (e.g. convolution output.pdf)"}
                                  </span>
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => handleTaskFileChange(lesson.id, e)}
                                    className="hidden"
                                  />
                                </label>
                              </div>

                              {draft.error && <p className="text-xs text-red-400">{draft.error}</p>}

                              <div className="flex flex-wrap items-center gap-3 pt-1">
                                <button
                                  type="button"
                                  onClick={() => saveLessonTask(lesson.id)}
                                  disabled={draft.saving}
                                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Save size={14} />
                                  {draft.saving ? "Saving…" : hasExisting ? "Update Task" : "Assign Task"}
                                </button>

                                {hasExisting && lesson.task?.hasFile && (
                                  <button
                                    type="button"
                                    onClick={() => viewLessonTaskPdf(lesson.id)}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
                                  >
                                    <ExternalLink size={13} />
                                    View {lesson.task.fileName || "PDF"}
                                  </button>
                                )}

                                {hasExisting && (
                                  <button
                                    type="button"
                                    onClick={() => removeLessonTask(lesson.id)}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-red-400"
                                  >
                                    <Trash2 size={13} />
                                    Remove Task
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      )}

                    </div>

                  </div>

                </article>

              )
            )}

          </div>


          {/* =================================================
              EMPTY LESSON STATE
          ================================================= */}

          {course.lessons.length ===
            0 && (

            <div className="mt-6 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-14 text-center">

              <BookOpen
                size={32}
                className="mx-auto text-slate-700"
              />

              <h3 className="mt-4 text-lg font-semibold">
                No lessons yet
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Start building your course by adding the first lesson.
              </p>

              <button
                type="button"
                onClick={addLesson}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500"
              >
                <Plus size={17} />
                Add First Lesson
              </button>

            </div>

          )}

        </section>


        {/* =================================================
            BOTTOM SAVE
        ================================================= */}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/teacher/dashboard"
              )
            }
            className="rounded-xl border border-slate-800 px-6 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? "Saving…" : "Save Changes"}
          </button>

        </div>

      </main>

    </div>
  );
}


/* =====================================================
   SMALL CLOCK ICON
===================================================== */

function ClockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-500"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

export default ManageCourse;