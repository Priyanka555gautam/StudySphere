import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  X,
  UserCircle,
  Home,
  Compass,
  Settings,
  Bell,
  HelpCircle,
  BookOpen,
  LogOut,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";


function ProfileDrawer({
  open,
  onClose,
  role = "student",
}) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  if (!open) return null;

  const isTeacher = role === "teacher";


  /* =====================================================
     NAVIGATION
  ===================================================== */

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate("/login");
  };


  return (
    /* =====================================================
       BACKDROP
    ===================================================== */

    <div
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >

      {/* =================================================
          DRAWER
      ================================================= */}

      <aside
        className="fixed right-0 top-0 bottom-0 z-[10000] flex h-full w-full max-w-sm flex-col border-l border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">

          <h2 className="text-lg font-semibold text-white">
            Profile
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <X size={19} />
          </button>

        </div>


        {/* =================================================
            PROFILE INFORMATION
        ================================================= */}

        <div className="shrink-0 border-b border-slate-800 p-6">

          <div className="flex items-center gap-4">

            {/* Avatar */}

            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                isTeacher
                  ? "bg-purple-500/10 text-purple-400"
                  : "bg-blue-500/10 text-blue-400"
              }`}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "User Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle
                  size={32}
                  strokeWidth={1.6}
                />
              )}
            </div>


            {/* User information */}

            <div className="min-w-0">

              <h3 className="truncate font-semibold text-white">
                {user?.name || (isTeacher ? "Teacher" : "Student")}
              </h3>

              <p className="mt-1 truncate text-sm text-slate-500">
                {user?.email || (isTeacher ? "StudySphere Teacher" : "StudySphere Student")}
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  isTeacher
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {isTeacher
                  ? "Teacher Account"
                  : "Student Account"}
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            MENU
        ================================================= */}

        <div className="flex-1 overflow-y-auto p-4">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
            Navigation & Account
          </p>

          {/* =================================================
              HOME PAGE LINK
          ================================================= */}

          <button
            type="button"
            onClick={() => handleNavigate("/")}
            className="group flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition hover:bg-slate-900"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition group-hover:bg-slate-800 group-hover:text-white">
              <Home size={19} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">
                Home Page
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Return to home landing page
              </p>
            </div>
            <ChevronRight
              size={17}
              className="text-slate-700 transition group-hover:text-slate-400"
            />
          </button>

          {/* =================================================
              EXPLORE COURSES LINK
          ================================================= */}

          <button
            type="button"
            onClick={() => handleNavigate("/explore")}
            className="group flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition hover:bg-slate-900"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition group-hover:bg-slate-800 group-hover:text-white">
              <Compass size={19} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">
                Explore Courses
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Browse all available courses
              </p>
            </div>
            <ChevronRight
              size={17}
              className="text-slate-700 transition group-hover:text-slate-400"
            />
          </button>


          {/* =================================================
              DASHBOARD
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              handleNavigate(
                isTeacher
                  ? "/teacher/dashboard"
                  : "/student/dashboard"
              )
            }
            className="group flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition hover:bg-slate-900"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition group-hover:bg-slate-800 group-hover:text-white">
              <LayoutDashboard size={19} />
            </div>

            <div className="flex-1">

              <p className="text-sm font-medium text-slate-200">
                Dashboard
              </p>

              <p className="mt-0.5 text-xs text-slate-600">
                Go to your dashboard
              </p>

            </div>

            <ChevronRight
              size={17}
              className="text-slate-700 transition group-hover:text-slate-400"
            />

          </button>


          {/* =================================================
              MY PROFILE
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              handleNavigate(
                isTeacher
                  ? "/teacher/profile"
                  : "/student/profile"
              )
            }
            className="group flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition hover:bg-slate-900"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition group-hover:bg-slate-800 group-hover:text-white">
              <UserCircle size={19} />
            </div>

            <div className="flex-1">

              <p className="text-sm font-medium text-slate-200">
                My Profile
              </p>

              <p className="mt-0.5 text-xs text-slate-600">
                View and edit your profile
              </p>

            </div>

            <ChevronRight
              size={17}
              className="text-slate-700 transition group-hover:text-slate-400"
            />

          </button>


          {/* =================================================
              COURSES
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              handleNavigate(
                isTeacher
                  ? "/teacher/courses"
                  : "/student/courses"
              )
            }
            className="group flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition hover:bg-slate-900"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition group-hover:bg-slate-800 group-hover:text-white">
              <BookOpen size={19} />
            </div>

            <div className="flex-1">

              <p className="text-sm font-medium text-slate-200">
                My Courses
              </p>

              <p className="mt-0.5 text-xs text-slate-600">
                {isTeacher
                  ? "Manage your courses"
                  : "View your enrolled courses"}
              </p>

            </div>

            <ChevronRight
              size={17}
              className="text-slate-700 transition group-hover:text-slate-400"
            />

          </button>


          {/* =================================================
              SETTINGS
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              handleNavigate(
                isTeacher
                  ? "/teacher/settings"
                  : "/student/settings"
              )
            }
            className="group flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition hover:bg-slate-900"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition group-hover:bg-slate-800 group-hover:text-white">
              <Settings size={19} />
            </div>

            <div className="flex-1">

              <p className="text-sm font-medium text-slate-200">
                Settings
              </p>

              <p className="mt-0.5 text-xs text-slate-600">
                Manage your preferences
              </p>

            </div>

            <ChevronRight
              size={17}
              className="text-slate-700 transition group-hover:text-slate-400"
            />

          </button>


          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              handleNavigate(
                isTeacher
                  ? "/teacher/notifications"
                  : "/student/notifications"
              )
            }
            className="group flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition hover:bg-slate-900"
          >

            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition group-hover:bg-slate-800 group-hover:text-white">

              <Bell size={19} />

              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />

            </div>

            <div className="flex-1">

              <p className="text-sm font-medium text-slate-200">
                Notifications
              </p>

              <p className="mt-0.5 text-xs text-slate-600">
                Manage your notifications
              </p>

            </div>

            <ChevronRight
              size={17}
              className="text-slate-700 transition group-hover:text-slate-400"
            />

          </button>


          {/* =================================================
              HELP & SUPPORT
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              handleNavigate("/help")
            }
            className="group flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left transition hover:bg-slate-900"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition group-hover:bg-slate-800 group-hover:text-white">
              <HelpCircle size={19} />
            </div>

            <div className="flex-1">

              <p className="text-sm font-medium text-slate-200">
                Help & Support
              </p>

              <p className="mt-0.5 text-xs text-slate-600">
                Get help with StudySphere
              </p>

            </div>

            <ChevronRight
              size={17}
              className="text-slate-700 transition group-hover:text-slate-400"
            />

          </button>

        </div>


        {/* =================================================
            LOGOUT
        ================================================= */}

        <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-4">

          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-4 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3.5 text-left transition hover:border-red-500/20 hover:bg-red-500/10"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition group-hover:bg-red-500/15">
              <LogOut size={19} />
            </div>

            <div className="flex-1">

              <p className="text-sm font-semibold text-red-400">
                Logout
              </p>

              <p className="mt-0.5 text-xs text-red-400/50">
                Sign out of your account
              </p>

            </div>

          </button>

        </div>

      </aside>

    </div>
  );
}


export default ProfileDrawer;