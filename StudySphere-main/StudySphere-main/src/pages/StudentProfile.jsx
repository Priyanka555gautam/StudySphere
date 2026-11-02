import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  GraduationCap,
  MapPin,
  Save,
  Plus,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";

function StudentProfile() {
  const { user, updateProfile } = useAuth();

  /* =====================================================
     PROFILE DATA
  ===================================================== */

  const defaultProfile = {
    name: user?.name || "Student",
    email: user?.email || "student@studysphere.com",
    course: user?.studentClass || "B.Tech",
    branch: "Electronics & Communication Engineering",
    location: "India",
    avatar: user?.avatar || null,
    favoriteTopics: [],
  };

  const [profile, setProfile] = useState(defaultProfile);

  const [topicInput, setTopicInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem("studentProfile");

    let parsedProfile = {};

    if (savedProfile) {
      try {
        parsedProfile = JSON.parse(savedProfile);
      } catch (error) {
        console.error("Failed to load student profile:", error);
      }
    }

    setProfile({
      ...defaultProfile,
      ...parsedProfile,
      name: user?.name || parsedProfile.name || defaultProfile.name,
      email: user?.email || parsedProfile.email || defaultProfile.email,
      course: user?.studentClass || parsedProfile.course || defaultProfile.course,
      avatar: user?.avatar || parsedProfile.avatar || defaultProfile.avatar,
      favoriteTopics: Array.isArray(parsedProfile.favoriteTopics)
        ? parsedProfile.favoriteTopics
        : [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setProfile((prev) => ({ ...prev, avatar: dataUrl }));
      await updateProfile({ avatar: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  /* =====================================================
     HANDLE NORMAL INPUT CHANGES
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaved(false);
  };

  /* =====================================================
     ADD FAVORITE TOPIC
  ===================================================== */

  const addTopic = () => {
    const topic = topicInput.trim();

    // Don't add empty topic
    if (!topic) return;

    // Prevent duplicate topics
    const alreadyExists = profile.favoriteTopics.some(
      (item) => item.toLowerCase() === topic.toLowerCase()
    );

    if (alreadyExists) {
      setTopicInput("");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      favoriteTopics: [
        ...prev.favoriteTopics,
        topic,
      ],
    }));

    setTopicInput("");
    setSaved(false);
  };

  /* =====================================================
     REMOVE FAVORITE TOPIC
  ===================================================== */

  const removeTopic = (topicToRemove) => {
    setProfile((prev) => ({
      ...prev,
      favoriteTopics: prev.favoriteTopics.filter(
        (topic) => topic !== topicToRemove
      ),
    }));

    setSaved(false);
  };

  /* =====================================================
     ADD TOPIC WITH ENTER
  ===================================================== */

  const handleTopicKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTopic();
    }
  };

  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      await authApi.updateProfile({ studentClass: profile.course });
    } catch (err) {
      console.error("Failed to update profile class:", err);
    }

    localStorage.setItem(
      "studentProfile",
      JSON.stringify(profile)
    );

    setSaved(true);
  };

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b border-slate-800">

        <div className="mx-auto max-w-5xl px-6 py-8">

          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>

          <div className="mt-7">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Account
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              My Profile
            </h1>

            <p className="mt-2 text-slate-400">
              Manage your personal information and learning details.
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          PROFILE CONTENT
      ===================================================== */}

      <main className="mx-auto max-w-5xl px-6 py-10">

        <div className="grid gap-6 lg:grid-cols-3">


          {/* =================================================
              PROFILE CARD
          ================================================= */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="flex flex-col items-center text-center">

              {/* Avatar */}

              <div className="relative">

                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">

                  {profile.avatar || user?.avatar ? (
                    <img
                      src={profile.avatar || user?.avatar}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      size={52}
                      strokeWidth={1.5}
                    />
                  )}

                </div>

                <label
                  className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  title="Change profile picture"
                >
                  <Camera size={17} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>

              </div>


              <h2 className="mt-5 text-xl font-semibold">
                {profile.name || "Student"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                StudySphere Student
              </p>

              <span className="mt-4 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                Student Account
              </span>

            </div>


            {/* Quick information */}

            <div className="mt-8 border-t border-slate-800 pt-6">

              <div className="flex items-center gap-3 text-sm">

                <GraduationCap
                  size={18}
                  className="text-slate-500"
                />

                <span className="text-slate-400">
                  {profile.course}
                </span>

              </div>


              <div className="mt-4 flex items-center gap-3 text-sm">

                <MapPin
                  size={18}
                  className="text-slate-500"
                />

                <span className="text-slate-400">
                  {profile.location}
                </span>

              </div>


              {/* Favorite topic count */}

              <div className="mt-4 flex items-center gap-3 text-sm">

                <div className="flex h-[18px] w-[18px] items-center justify-center rounded border border-slate-600 text-[10px] text-slate-500">
                  #
                </div>

                <span className="text-slate-400">
                  {profile.favoriteTopics.length} favorite{" "}
                  {profile.favoriteTopics.length === 1
                    ? "topic"
                    : "topics"}
                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              EDIT PROFILE
          ================================================= */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-2">

            <div className="border-b border-slate-800 pb-5">

              <h2 className="text-lg font-semibold">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update your information below.
              </p>

            </div>


            <form
              onSubmit={handleSave}
              className="mt-6 space-y-6"
            >


              {/* =================================================
                  FULL NAME
              ================================================= */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Full Name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="signup-input signup-input-icon"
                    placeholder="Enter your name"
                  />

                </div>

              </div>


              {/* =================================================
                  EMAIL
              ================================================= */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="signup-input signup-input-icon"
                    placeholder="Enter your email"
                  />

                </div>

              </div>


              {/* =================================================
                  COURSE + BRANCH
              ================================================= */}

              <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">

                {/* Course */}

                <div>

                  <label
                    htmlFor="course"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Course
                  </label>

                  <input
                    id="course"
                    name="course"
                    value={profile.course}
                    onChange={handleChange}
                    className="signup-input"
                    placeholder="e.g. B.Tech"
                  />

                </div>


                {/* Branch */}

                <div>

                  <label
                    htmlFor="branch"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Branch
                  </label>

                  <input
                    id="branch"
                    name="branch"
                    value={profile.branch}
                    onChange={handleChange}
                    className="signup-input"
                    placeholder="Your branch"
                  />

                </div>

              </div>


              {/* =================================================
                  FAVORITE TOPICS
              ================================================= */}

              <div>

                <label
                  htmlFor="favoriteTopics"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Favorite Topics
                </label>

                <p className="mb-3 text-xs leading-5 text-slate-500">
                  Add subjects or topics you are interested in.
                  These will help StudySphere recommend relevant
                  courses for you.
                </p>


                {/* Topic container */}

                <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 transition-colors focus-within:border-blue-500">


                  {/* Existing tags */}

                  {profile.favoriteTopics.length > 0 && (

                    <div className="flex flex-wrap gap-2">

                      {profile.favoriteTopics.map((topic) => (

                        <span
                          key={topic}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-400"
                        >

                          {topic}

                          <button
                            type="button"
                            onClick={() => removeTopic(topic)}
                            className="flex h-4 w-4 items-center justify-center rounded text-blue-400/60 transition hover:bg-blue-500/10 hover:text-blue-300"
                            aria-label={`Remove ${topic}`}
                          >
                            <X size={13} />
                          </button>

                        </span>

                      ))}

                    </div>

                  )}


                  {/* Topic input */}

                  <div
                    className={`flex items-center gap-2 ${
                      profile.favoriteTopics.length > 0
                        ? "mt-2"
                        : ""
                    }`}
                  >

                    <input
                      id="favoriteTopics"
                      value={topicInput}
                      onChange={(event) =>
                        setTopicInput(event.target.value)
                      }
                      onKeyDown={handleTopicKeyDown}
                      className="w-full bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-slate-600"
                      placeholder={
                        profile.favoriteTopics.length === 0
                          ? "e.g. DSA, React, Python..."
                          : "Add another topic..."
                      }
                    />

                    <button
                      type="button"
                      onClick={addTopic}
                      disabled={!topicInput.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Add topic"
                    >
                      <Plus size={17} />
                    </button>

                  </div>

                </div>


                <p className="mt-2 text-xs text-slate-600">
                  Press Enter or click + to add a topic.
                </p>

              </div>


              {/* =================================================
                  LOCATION
              ================================================= */}

              <div>

                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Location
                </label>

                <div className="relative">

                  <MapPin
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="location"
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    className="signup-input signup-input-icon"
                    placeholder="Your location"
                  />

                </div>

              </div>


              {/* =================================================
                  SAVE
              ================================================= */}

              <div className="flex items-center justify-end gap-4 border-t border-slate-800 pt-5">

                {saved && (
                  <span className="text-sm text-emerald-400">
                    Changes saved
                  </span>
                )}

                <button
                  type="submit"
                  className="hero-button inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500"
                >

                  <Save size={17} />

                  Save Changes

                </button>

              </div>

            </form>

          </div>

        </div>

      </main>

    </div>
  );
}

export default StudentProfile;