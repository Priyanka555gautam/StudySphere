import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);

    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    localStorage.setItem("autoOpenFocus", "true");
    const redirectTo = location.state?.from || "/";

    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="page-enter relative min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* Background */}
      <div className="hero-orb hero-orb-blue" />
      <div className="hero-orb hero-orb-purple" />

      <div className="relative grid min-h-screen lg:grid-cols-2">

        {/* Left — branding panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-800 bg-slate-900/40 p-12 lg:flex">
          <Link to="/" className="group flex items-center gap-3">
            <div className="orbit-ring flex size-10 items-center justify-center">
              <img src="/logo.png" alt="StudySphere" className="size-10 object-contain" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Study<span className="text-gradient">Sphere</span>
            </span>
          </Link>

          <div className="relative">
            <div className="pointer-events-none absolute -left-10 -top-16 h-64 w-64 rounded-full border border-dashed border-blue-500/20" />
            <div className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full border border-dashed border-purple-500/10" />

            <h2 className="max-w-md text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Pick up right where your learning left off.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
              Your courses, focus sessions, and AI Mentor conversations are
              all waiting for you — synced and ready.
            </p>
          </div>

          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} StudySphere. All rights reserved.
          </p>
        </div>

        {/* Right — form */}
        <div className="relative flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Logo (mobile only) */}
            <Link to="/" className="mb-10 flex items-center justify-center gap-3 lg:hidden">
              <div className="orbit-ring flex size-10 items-center justify-center">
                <img src="/logo.png" alt="StudySphere" className="size-10 object-contain" />
              </div>
              <span className="text-2xl font-bold">
                Study<span className="text-gradient">Sphere</span>
              </span>
            </Link>

            <div className="glass-panel rounded-3xl p-8 shadow-2xl">
              <div className="text-center">
                <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Welcome back
                </h1>
                <p className="mt-3 text-sm text-slate-500">
                  Continue your learning journey with StudySphere.
                </p>
              </div>

              {/* Form */}
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="signup-input"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="link-underline text-xs text-blue-400 hover:text-blue-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="signup-input signup-input-with-toggle"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn-primary w-full !py-3 disabled:opacity-60">
                  {submitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-slate-500">
                Don't have an account?
                <Link
                  to="/signup"
                  className="link-underline ml-1 font-medium text-blue-400 hover:text-blue-300"
                >
                  Create one
                </Link>
              </p>
            </div>

            <Link
              to="/"
              className="mt-6 block text-center text-sm text-slate-600 transition-colors hover:text-slate-400"
            >
              ← Back to StudySphere
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
