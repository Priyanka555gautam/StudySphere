import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

function ComingSoon({ title = "This page", backTo = "/" }) {
  return (
    <div className="page-enter flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-blue-400">
        <Construction size={28} strokeWidth={1.6} />
      </div>

      <h1 className="mt-6 text-2xl font-bold">
        {title} is coming soon
      </h1>

      <p className="mt-3 max-w-sm text-sm text-slate-400">
        We're still building this part of StudySphere. Check back soon!
      </p>

      <Link
        to={backTo}
        className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back
      </Link>
    </div>
  );
}

export default ComingSoon;
