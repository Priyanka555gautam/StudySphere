import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-blue-600/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-0 h-72 w-72 rounded-full bg-purple-600/5 blur-3xl" />

      {/* Main Footer */}
      <div className="relative mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">

          {/* Brand */}
          <div className="lg:col-span-2">

            <Link
              to="/"
              className="group flex items-center gap-3"
            >
              <div className="orbit-ring flex size-10 items-center justify-center">
                <img
                  src="/logo.png"
                  alt="StudySphere"
                  className="size-10 object-contain transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                Study<span className="text-gradient">Sphere</span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
              A smarter learning platform designed to help students
              stay focused, organized, and consistent throughout
              their learning journey.
            </p>

            {/* Contact */}
            <div className="mt-6">

              <p className="text-sm font-medium text-slate-300">
                Have a question?
              </p>

              <a
                href="mailto:support@studysphere.com"
                className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
              >
                support@studysphere.com
              </a>

            </div>

          </div>


          {/* Product */}
          <div>

            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Product
            </h3>

            <ul className="mt-5 space-y-3">

              <li>
                <Link
                  to="/focus"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Focus
                </Link>
              </li>

              <li>
                <Link
                  to="/ai-mentor"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  AI Mentor
                </Link>
              </li>

              <li>
                <Link
                  to="/organize"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Organize
                </Link>
              </li>

              <li>
                <Link
                  to="/progress"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Progress
                </Link>
              </li>

              <li>
                <Link
                  to="/platforms"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Platforms
                </Link>
              </li>

            </ul>

          </div>


          {/* Resources */}
          <div>

            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Resources
            </h3>

            <ul className="mt-5 space-y-3">

              <li>
                <Link
                  to="/notes"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Notes
                </Link>
              </li>

              <li>
                <Link
                  to="/study-plans"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Study Plans
                </Link>
              </li>

              <li>
                <Link
                  to="/help"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>

              <li>
                <Link
                  to="/faq"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  FAQs
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>

            </ul>

          </div>


          {/* Legal */}
          <div>

            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h3>

            <ul className="mt-5 space-y-3">

              <li>
                <Link
                  to="/privacy"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  to="/terms"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>

              <li>
                <Link
                  to="/cookies"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>

              <li>
                <Link
                  to="/refund"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Refund Policy
                </Link>
              </li>

              <li>
                <Link
                  to="/security"
                  className="link-underline text-sm hover:text-white transition-colors"
                >
                  Security
                </Link>
              </li>

            </ul>

          </div>

        </div>


        {/* Contact / Query Box */}
        <div className="feature-card mt-16 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:flex md:items-center md:justify-between">

          <div>

            <h3 className="text-lg font-semibold text-white">
              Have feedback or a query?
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              We'd love to hear from you. Reach out and we'll get
              back to you as soon as possible.
            </p>

          </div>

          <a
            href="mailto:support@studysphere.com"
            className="btn-primary mt-5 md:mt-0"
          >
            Contact Support
          </a>

        </div>

      </div>


      {/* Bottom Bar */}
      <div className="border-t border-slate-800">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">

          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} StudySphere. All rights reserved.
          </p>


          {/* Social Links */}
          <div className="flex items-center gap-5">

            <a
              href="#"
              className="link-underline text-sm text-slate-500 hover:text-white transition-colors"
            >
              GitHub
            </a>

            <a
              href="#"
              className="link-underline text-sm text-slate-500 hover:text-white transition-colors"
            >
              LinkedIn
            </a>

            <a
              href="#"
              className="link-underline text-sm text-slate-500 hover:text-white transition-colors"
            >
              Instagram
            </a>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;