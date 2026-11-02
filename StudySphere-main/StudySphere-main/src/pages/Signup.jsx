import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    studentClass: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);

    const result = await signup({
      name: form.name,
      email: form.email,
      password: form.password,
      studentClass: form.studentClass,
      role: "student",
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      return;
    }

    localStorage.setItem("autoOpenFocus", "true");
    navigate("/", { replace: true });
  };

  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">

      {/* Background */}
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />


      {/* Main */}
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* Logo */}
          <Link
            to="/"
            className="group mb-8 flex items-center justify-center gap-3"
          >

            <div className="orbit-ring flex size-10 items-center justify-center">
              <img
                src="/logo.png"
                alt="StudySphere"
                className="size-10 object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Study<span className="text-gradient">Sphere</span>
            </span>

          </Link>


          {/* Card */}
          <div className="glass-panel rounded-3xl p-8 shadow-2xl">

            <div className="text-center">

              <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Create your account
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                Start building a smarter learning routine today.
              </p>

            </div>


            {/* Form */}
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full name
                </label>

                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="signup-input"
                />
                {fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.name}</p>
                )}

              </div>


              {/* Email */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="signup-input"
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>
                )}

              </div>


              {/* Class / Grade */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Class / Grade / Branch
                </label>

                <input
                  type="text"
                  name="studentClass"
                  required
                  value={form.studentClass}
                  onChange={handleChange}
                  placeholder="e.g. Class 10th, B.Tech ECE, Grade 12"
                  className="signup-input"
                />
                {fieldErrors.studentClass && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.studentClass}</p>
                )}

              </div>


              {/* Password */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
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
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>
                )}

              </div>


              {/* Confirm */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
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


              {/* Terms */}
              <div className="flex items-start gap-3 pt-1">

                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-blue-600"
                />

                <p className="text-xs leading-5 text-slate-500">

                  I agree to the{" "}

                  <Link
                    to="/terms"
                    className="link-underline text-blue-400 hover:text-blue-300"
                  >
                    Terms of Service
                  </Link>

                  {" "}and{" "}

                  <Link
                    to="/privacy"
                    className="link-underline text-blue-400 hover:text-blue-300"
                  >
                    Privacy Policy
                  </Link>

                </p>

              </div>


              {/* Signup */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full !py-3 disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create account"}
              </button>

            </form>


            {/* Login */}
            <p className="mt-6 text-center text-sm text-slate-500">

              Already have an account?

              <Link
                to="/login"
                className="link-underline ml-1 font-medium text-blue-400 hover:text-blue-300"
              >
                Sign in
              </Link>

            </p>

          </div>


          <Link
            to="/"
            className="mt-5 block text-center text-sm text-slate-600 transition-colors hover:text-slate-400"
          >
            ← Back to StudySphere
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Signup;