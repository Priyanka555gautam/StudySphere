function AIMentor() {
  return (
    <div className="page-enter min-h-screen bg-slate-950 px-6 py-16 text-white">

      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            StudySphere AI
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Meet your AI Mentor
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Your personal study companion that helps you understand
            concepts, plan your learning, and stay on track.
          </p>

        </div>


        {/* AI Mentor Section */}
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">


          {/* Robot */}
          <div className="flex justify-center">

            <div className="relative">

              {/* Glow */}
              <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-3xl" />

              {/* Image */}
              <img
                src="/chatbot.jpg"
                alt="StudySphere AI Mentor"
                className="relative h-105 w-105 object-contain drop-shadow-2xl"
              />

            </div>

          </div>


          {/* Chat Area */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

            {/* Chat Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 text-xl">
                🤖
              </div>

              <div>

                <h2 className="font-semibold">
                  StudySphere AI Mentor
                </h2>

                <div className="mt-1 flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-green-400" />

                  <span className="text-xs text-slate-500">
                    Online and ready to help
                  </span>

                </div>

              </div>

            </div>


            {/* Chat Messages */}
            <div className="space-y-5 py-6">

              {/* AI Message */}
              <div className="flex gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs">
                  AI
                </div>

                <div className="max-w-md rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3">

                  <p className="text-sm leading-6 text-slate-300">
                    Hi! 👋 I'm your StudySphere Mentor.
                    What are you learning today?
                  </p>

                </div>

              </div>


              {/* User Message */}
              <div className="flex justify-end">

                <div className="max-w-md rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3">

                  <p className="text-sm leading-6">
                    I want to understand binary search.
                  </p>

                </div>

              </div>


              {/* AI Message */}
              <div className="flex gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs">
                  AI
                </div>

                <div className="max-w-md rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3">

                  <p className="text-sm leading-6 text-slate-300">
                    Absolutely! I can explain it step-by-step,
                    show you an example, and then give you a
                    small problem to practice.
                  </p>

                </div>

              </div>

            </div>


            {/* Input */}
            <div className="border-t border-slate-800 pt-5">

              <div className="flex items-center gap-3">

                <input
                  type="text"
                  placeholder="Ask your AI Mentor anything..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />

                <button
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg hover:bg-blue-500"
                >
                  →
                </button>

              </div>

            </div>

          </div>

        </div>


        {/* Quick Actions */}
        <div className="mt-12">

          <h2 className="text-center text-xl font-semibold">
            What can your AI Mentor do?
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <button className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left transition hover:-translate-y-1 hover:border-blue-500/50">

              <div className="text-2xl">
                🧠
              </div>

              <h3 className="mt-4 font-semibold">
                Explain a Topic
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Get difficult concepts explained in simple,
                easy-to-understand language.
              </p>

            </button>


            <button className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left transition hover:-translate-y-1 hover:border-blue-500/50">

              <div className="text-2xl">
                📚
              </div>

              <h3 className="mt-4 font-semibold">
                Create a Study Plan
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Build a personalized study plan based on your
                goals and available time.
              </p>

            </button>


            <button className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left transition hover:-translate-y-1 hover:border-blue-500/50">

              <div className="text-2xl">
                🎯
              </div>

              <h3 className="mt-4 font-semibold">
                Quiz Me
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Test your understanding with personalized
                questions and instant feedback.
              </p>

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AIMentor;