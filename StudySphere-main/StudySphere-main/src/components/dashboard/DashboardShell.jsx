import StudentNavbar from "../student/StudentNavbar";
import TeacherNavbar from "../teacher/TeacherNavbar";
import { useAuth } from "../../context/AuthContext";

/* =====================================================
   DASHBOARD SHELL
   Wraps any page that a logged-in student or teacher can
   reach FROM their dashboard (Focus, Organize, AI Mentor,
   Community, Platforms, Progress). It renders the same
   role-specific navbar as the dashboard itself, so
   clicking into one of these sections keeps you inside
   the dashboard experience instead of dropping you back
   onto the public marketing layout (with the public
   Navbar + Footer).
===================================================== */

function DashboardShell({ children }) {
  const { user } = useAuth();

  const Navbar = user?.role === "teacher" ? TeacherNavbar : StudentNavbar;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}

export default DashboardShell;
