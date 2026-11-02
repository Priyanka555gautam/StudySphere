import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="orbit-loader mx-auto" />

          <p className="mt-4 text-sm text-slate-500">
            Loading StudySphere...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Logged in but wrong role
  if (role && user.role !== role) {
    if (user.role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }

    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;