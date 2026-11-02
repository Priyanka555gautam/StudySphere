import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const result = await resetPassword(token, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    const redirectTo = result.user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="page-enter relative min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* Background */}
      <div className="hero-orb hero-orb-blue" />
      <div className="hero-orb hero-orb-purple" />

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <Link to="/" className="group mb-10 flex items-center justify-center gap-3">
            <div className="orbit-ring flex size-10 items-center justify-center">
              <img src="/logo.png" alt="StudySphere" className="size-10 object-contain transition-transform duration-500 group-hover:scale-110" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Study<span className="text-gradient">Sphere</span>
            </span>
          </Link>

          <div className="glass-panel rounded-3xl p-8 shadow-2xl">

            {!token ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                  <XCircle size={28} />
                </div>

                <h1 className="mt-5 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Missing reset link
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  This page needs a reset token from the link in your email.
                  Request a new one below.
                </p>

                <Link
                  to="/forgot-password"
                  className="btn-primary mt-8 inline-flex w-full items-center justify-center !py-3"
                >
                  Request a new link
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    Set a new password
                  </h1>
                  <p className="mt-3 text-sm text-slate-500">
                    Choose a new password for your account.
                  </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {error}
                      {error.toLowerCase().includes("expired") && (
                        <>
                          {" "}
                          <Link to="/forgot-password" className="link-underline font-medium text-red-200">
                            Request a new link
                          </Link>
                        </>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
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

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="signup-input signup-input-with-toggle"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full !py-3 disabled:opacity-60"
                  >
                    {submitting ? "Resetting…" : "Reset password"}
                  </button>
                </form>
              </>
            )}
          </div>

          <Link
            to="/login"
            className="mt-6 block text-center text-sm text-slate-600 transition-colors hover:text-slate-400"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
