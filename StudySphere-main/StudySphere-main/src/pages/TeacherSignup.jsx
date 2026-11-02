import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function TeacherSignup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    expertise: "",
    bio: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: "teacher",
      expertise: formData.expertise,
      bio: formData.bio,
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

      {/* Background glow */}
      <div className="pointer-events-none fixed left-1/4 top-10 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="pointer-events-none fixed bottom-0 right-0 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-5 py-8">

        <div className="w-full max-w-xl">

          {/* Logo */}

          <Link
            to="/"
            className="group mb-10 flex items-center justify-center gap-3"
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


          {/* Signup Card */}

          <div className="glass-panel rounded-2xl p-6 shadow-2xl md:p-8">

            {/* Header */}

            <div className="mb-6 text-center">


              <h1 className="mt-2 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Create your account as<span className="text-gradient"> Teacher</span>
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Teach, create courses, and help students grow.
              </p>

            </div>


            {/* Form */}

            <form onSubmit={handleSubmit} className="space-y-4">

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Name + Email */}

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm text-slate-300">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="signup-input"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs text-red-400">{fieldErrors.name}</p>
                  )}
                </div>


                <div>
                  <label className="mb-1.5 block text-sm text-slate-300">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="signup-input"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>
                  )}
                </div>

              </div>


              {/* Expertise */}

              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  Subject / Expertise
                </label>

                <input
                  type="text"
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleChange}
                  placeholder="e.g. Mathematics, DSA, Physics"
                  required
                  className="signup-input"
                />
              </div>


              {/* Bio */}

              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  Short Bio
                  <span className="ml-2 text-xs text-slate-600">
                    Optional
                  </span>
                </label>

                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="2"
                  maxLength="300"
                  placeholder="Tell students a little about yourself..."
                  className="signup-input resize-none"
                />
              </div>


              {/* Password */}

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm text-slate-300">
                    Password
                  </label>

                  <div className="relative">

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create password"
                      minLength="8"
                      required
                      className="signup-input signup-input-with-toggle"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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


                <div>
                  <label className="mb-1.5 block text-sm text-slate-300">
                    Confirm Password
                  </label>

                  <div className="relative">

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      required
                      className="signup-input signup-input-with-toggle"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                  </div>
                </div>

              </div>


              {/* Terms */}

              <label className="flex items-start gap-2 pt-1 text-xs leading-5 text-slate-500">

                <input
                  type="checkbox"
                  required
                  className="mt-1 accent-blue-600"
                />

                <span>
                  I agree to the StudySphere terms and understand that
                  my teacher profile may be visible to students.
                </span>

              </label>


              {/* Submit */}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full !py-3 disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create Teacher Account"}
              </button>

            </form>


            {/* Bottom */}

            <div className="mt-5 flex flex-col items-center gap-2 border-t border-slate-800 pt-5 text-sm">

              <p className="text-slate-500">
                Already have an account?
                <Link
                  to="/login"
                  className="link-underline ml-1 text-blue-400 hover:text-blue-300"
                >
                  Log in
                </Link>
              </p>

              <p className="text-slate-600">
                Want to learn instead?
                <Link
                  to="/signup"
                  className="ml-1 text-slate-400 hover:text-white"
                >
                  Student signup
                </Link>
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default TeacherSignup;