import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ProfileDrawer from "./dashboard/ProfileDrawer";

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="size-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 9v11.5h14V9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20.5v-6h6v6" />
  </svg>
);

const MenuIcon = ({ open }) => (
  <div className="relative flex size-5 flex-col items-center justify-center gap-[5px]">
    <span
      className={`hamburger-line h-[1.5px] w-5 bg-white ${open ? "translate-y-[6.5px] rotate-45" : ""}`}
    />
    <span
      className={`hamburger-line h-[1.5px] w-5 bg-white ${open ? "opacity-0" : "opacity-100"}`}
    />
    <span
      className={`hamburger-line h-[1.5px] w-5 bg-white ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`}
    />
  </div>
);

function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const dashboardPath =
    user?.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";

  const navLinks = [
    { name: "Home", path: "/", icon: true },
    { name: "AI Mentor", path: "/ai-mentor" },
    { name: "Explore", path: "/explore" },
    { name: "Community", path: "/community" },
    { name: "Platforms", path: "/platforms" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`nav-glass fixed left-0 top-0 z-50 w-full border-b border-slate-800/80 ${scrolled ? "nav-glass-scrolled" : ""
          }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="orbit-ring flex size-10 items-center justify-center">
              <img
                src="/logo.png"
                alt="StudySphere"
                className="size-10 object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <span className="text-[22px] font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
              Study<span className="text-gradient">Sphere</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                    ? "text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-lg bg-white/10 ring-1 ring-inset ring-white/10" />
                  )}
                  <span className="relative flex items-center gap-2">
                    {link.icon && <HomeIcon />}
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to={dashboardPath}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  <LayoutDashboard size={17} strokeWidth={1.8} />
                  Dashboard
                </Link>

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
              </div>
            ) : (
              <Link to="/login" className="btn-primary !py-2.5 !px-6 hidden sm:inline-flex">
                Sign in
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="flex size-10 items-center justify-center rounded-lg border border-slate-800 bg-white/5 md:hidden"
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu-enter border-t border-slate-800/80 bg-slate-950/95 px-6 py-4 backdrop-blur md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    {link.icon && <HomeIcon />}
                    {link.name}
                  </Link>
                );
              })}

              {isAuthenticated ? (
                <div className="mt-3 flex flex-col gap-2 sm:hidden">
                  <Link
                    to={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    <LayoutDashboard size={18} strokeWidth={1.8} />
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-800"
                  >
                    <UserCircle size={18} strokeWidth={1.7} />
                    Profile
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary mt-3 w-full sm:hidden"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {isAuthenticated && (
        <ProfileDrawer
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          role={user?.role || "student"}
        />
      )}
    </>
  );
}

export default Navbar;
