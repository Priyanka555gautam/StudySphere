import { useState } from "react";
import {
  NavLink,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Compass,
  LayoutDashboard,
  Bot,
  Users,
  UserCircle,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";

import ProfileDrawer from "../dashboard/ProfileDrawer";

function TeacherNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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
      path: "/teacher/dashboard",
      icon: LayoutDashboard,
    },
  ];

  return (
    <>
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          {/* Logo */}

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

            <span className="hidden rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-400 sm:block">
              Teacher
            </span>
          </NavLink>


          {/* Desktop Navigation */}

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
                        ? "bg-purple-500/10 text-purple-400"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`
                  }
                >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                  />

                  <span>{item.name}</span>
                </NavLink>
              );
            })}

          </nav>


          {/* Right Side */}

          <div className="flex items-center gap-3">

            {/* PROFILE BUTTON */}

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Open profile"
              className="group flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 transition-all duration-200 hover:border-purple-500 hover:scale-105 overflow-hidden shadow-md"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "Profile"}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-purple-500/10 text-purple-400 font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle size={22} />}
                </div>
              )}
            </button>


            {/* Mobile Menu */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Toggle navigation"
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
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                        isActive
                          ? "bg-purple-500/10 text-purple-400"
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
          PROFILE DRAWER
      ===================================================== */}

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        role="teacher"
      />

    </>
  );
}

export default TeacherNavbar;
