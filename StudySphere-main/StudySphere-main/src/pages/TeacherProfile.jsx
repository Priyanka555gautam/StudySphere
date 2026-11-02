import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { teacherApi, authApi } from "../lib/api";
import { UserCheck, UserPlus, BookOpen, Award, ArrowLeft } from "lucide-react";

export default function TeacherProfile() {
  const { teacherId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchProfile();
    authApi.me().then(({ user }) => setCurrentUser(user)).catch(() => setCurrentUser(null));
  }, [teacherId]);

  async function fetchProfile() {
    setLoading(true);
    setError("");
    try {
      const res = await teacherApi.getProfile(teacherId);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load teacher profile.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFollow() {
    if (!currentUser) {
      alert("Please log in to follow teachers.");
      return;
    }
    if (currentUser.role === "teacher") {
      alert("Teachers cannot follow teachers.");
      return;
    }
    setToggling(true);
    try {
      const res = await teacherApi.toggleFollow(teacherId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: res.isFollowing,
              followersCount: res.followersCount,
            }
          : prev
      );
    } catch (err) {
      alert(err.message || "Failed to toggle follow.");
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-center text-white">
        <p className="text-red-400 mb-4">{error || "Teacher profile not found."}</p>
        <Link to="/explore" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium hover:bg-blue-500">
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </Link>
      </div>
    );
  }

  const { teacher, followersCount, isFollowing, courses } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/explore" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </Link>

        {/* Profile Card Header */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

          <div className="relative px-8 pb-8">
            <div className="-mt-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <img
                  src={teacher.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.id}`}
                  alt={teacher.name}
                  className="h-28 w-28 rounded-full border-4 border-slate-900 bg-slate-950 object-cover shadow-xl"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {teacher.name}
                    <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-400 font-medium">Instructor</span>
                  </h1>
                  {teacher.expertise && (
                    <p className="mt-1 text-sm text-blue-400 flex items-center gap-1.5 font-medium">
                      <Award className="h-4 w-4" /> {teacher.expertise}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">{followersCount} Followers</p>
                </div>
              </div>

              {/* Follow Button */}
              {currentUser?.role !== "teacher" && (
                <button
                  onClick={handleToggleFollow}
                  disabled={toggling}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm transition-all ${
                    isFollowing
                      ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                      : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25"
                  } disabled:opacity-50`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" /> Follow Teacher
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Bio */}
            {teacher.bio && (
              <div className="mt-6 border-t border-slate-800/80 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">About the Instructor</h3>
                <p className="text-sm leading-relaxed text-slate-300">{teacher.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Teacher Courses Section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-400" />
            Courses by {teacher.name} ({courses.length})
          </h2>

          {courses.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              This instructor hasn't published any courses yet.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:border-slate-700 hover:shadow-lg"
                >
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gradient-to-br from-blue-900/40 to-indigo-900/40 text-4xl">
                      📚
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="mb-2 self-start rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
                      {course.category || "General"}
                    </span>
                    <h3 className="font-bold text-white text-lg line-clamp-1">{course.title}</h3>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2 flex-1">{course.description}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
                      <span>{course.level || "Beginner"}</span>
                      <Link
                        to={`/explore/${course.id}`}
                        className="rounded-lg bg-blue-600 px-3.5 py-1.5 font-semibold text-white hover:bg-blue-500"
                      >
                        View Course
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
