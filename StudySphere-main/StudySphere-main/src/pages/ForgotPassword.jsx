import { Link } from "react-router-dom";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function ForgotPassword() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await forgotPassword(email);

    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDevResetUrl(result.devResetUrl || null);
    setSent(true);
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

            {sent ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 size={28} />
                </div>

                <h1 className="mt-5 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Check your email
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  If an account exists for <span className="text-slate-300">{email}</span>,
                  we've sent a link to reset your password. It expires in 30 minutes.
                </p>

                {devResetUrl && (
                  <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                      Dev mode — email sending isn't configured
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      No RESEND_API_KEY is set on the backend yet, so
                      here's the link that would normally be emailed:
                    </p>
                    <Link
                      to={(() => {
                        try {
                          const u = new URL(devResetUrl);
                          return `${u.pathname}${u.search}`;
                        } catch {
                          return "/reset-password";
                        }
                      })()}
                      className="mt-2 block break-all text-xs text-blue-400 hover:text-blue-300"
                    >
                      {devResetUrl}
                    </Link>
                  </div>
                )}

                <Link
                  to="/login"
                  className="mt-8 inline-flex items-center justify-center text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  ← Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    Forgot your password?
                  </h1>
                  <p className="mt-3 text-sm text-slate-500">
                    Enter the email on your account and we'll send you a
                    link to reset it.
                  </p>
                </div>

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

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full !py-3 disabled:opacity-60"
                  >
                    {submitting ? "Sending…" : "Send reset link"}
                  </button>
                </form>

                <p className="mt-7 text-center text-sm text-slate-500">
                  Remembered it after all?
                  <Link
                    to="/login"
                    className="link-underline ml-1 font-medium text-blue-400 hover:text-blue-300"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
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
  );
}

export default ForgotPassword;
