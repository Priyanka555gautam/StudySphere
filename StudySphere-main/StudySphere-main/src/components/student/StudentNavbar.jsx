import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  Home,
  Compass,
  LayoutDashboard,
  BookOpen,
  Bot,
  TrendingUp,
  CheckSquare,
  Users,
  UserCircle,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";

import ProfileDrawer from "../dashboard/ProfileDrawer";
import TaskDrawer from "../organize/TaskDrawer";


function StudentNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const { user } = useAuth();


  const navItems = [
    {
      name: "Home",
      path: "/",
      icon: Home,
    },
    {
      name: "Explore",
      path: "/explore",
      icon: Compass,
    },
    {
      name: "AI Mentor",
      path: "/ai-mentor",
      icon: Bot,
    },
    {
      name: "Community",
      path: "/community",
      icon: Users,
    },
    {
      name: "Dashboard",
      path: "/student/dashboard",
      icon: LayoutDashboard,
    },
  ];


  return (
    <>
      {/* =====================================================
          STUDENT NAVBAR
      ===================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          {/* =================================================
              LOGO
          ================================================= */}

          <NavLink
            to="/"
            className="group flex shrink-0 items-center gap-3"
          >

            <div className="orbit-ring flex size-10 items-center justify-center">
              <img
                src="/logo.png"
                alt="StudySphere"
                className="size-10 object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <span className="hidden text-[22px] font-bold tracking-tight text-white sm:block" style={{ fontFamily: "var(--font-display)" }}>
              Study<span className="text-gradient">Sphere</span>
            </span>

            <span className="hidden rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 sm:block">
              Student
            </span>

          </NavLink>


          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav className="hidden items-center gap-1 lg:flex">

            {navItems.map((item) => {

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`
                  }
                >

                  <Icon
                    size={17}
                    strokeWidth={1.8}
                  />

                  <span>
                    {item.name}
                  </span>

                </NavLink>
              );
            })}

          </nav>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div className="flex items-center gap-3">

            {/* Profile Button */}

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Open profile"
              className="group flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 transition-all duration-200 hover:border-blue-500 hover:scale-105 overflow-hidden shadow-md"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "Profile"}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-blue-500/10 text-blue-400 font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle size={22} />}
                </div>
              )}
            </button>


            {/* Mobile Menu Button */}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            >

              {mobileMenuOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}

            </button>

          </div>

        </div>


        {/* =====================================================
            MOBILE NAVIGATION
        ===================================================== */}

        {mobileMenuOpen && (

          <div className="mobile-menu-enter border-t border-slate-800 bg-slate-950 px-6 py-4 lg:hidden">

            <nav className="space-y-1">

              {navItems.map((item) => {

                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                        isActive
                          ? "bg-blue-500/10 text-blue-400"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white"
                      }`
                    }
                  >

                    <Icon
                      size={18}
                      strokeWidth={1.8}
                    />

                    {item.name}

                  </NavLink>
                );

              })}

            </nav>

          </div>

        )}

      </header>


      {/* =====================================================
          PROFILE & TASK DRAWERS
      ===================================================== */}

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        role="student"
      />

      <TaskDrawer
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
      />

    </>
  );
}


export default StudentNavbar;