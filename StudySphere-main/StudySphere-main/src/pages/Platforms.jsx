function Platforms() {
  const platforms = [
    {
      name: "LeetCode",
      icon: "💻",
      category: "DSA & Coding",
      description:
        "Practice coding problems, improve your problem-solving skills, and prepare for technical interviews.",
      color: "orange",
    },
    {
      name: "GitHub",
      icon: "🐙",
      category: "Projects & Development",
      description:
        "Build, manage, and showcase your projects while learning through real-world development.",
      color: "purple",
    },
    {
      name: "YouTube",
      icon: "▶️",
      category: "Video Learning",
      description:
        "Find tutorials, lectures, coding explanations, and educational content from creators worldwide.",
      color: "red",
    },
    {
      name: "GeeksforGeeks",
      icon: "🟢",
      category: "Programming & CS",
      description:
        "Learn programming, data structures, algorithms, and core computer science concepts.",
      color: "green",
    },
    {
      name: "MDN Web Docs",
      icon: "🌐",
      category: "Web Development",
      description:
        "Explore reliable documentation and references for HTML, CSS, JavaScript, and web APIs.",
      color: "blue",
    },
    {
      name: "Coursera",
      icon: "🎓",
      category: "Courses",
      description:
        "Explore structured courses and learning programs from universities and organizations.",
      color: "indigo",
    },
  ];

  return (
    <div className="page-enter min-h-screen bg-slate-950 px-6 py-16 text-white">

      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Platforms
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Everything you need to learn.
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
            Discover useful platforms, resources, and tools that can
            support your learning journey.
          </p>
        </div>


        {/* Search */}
        <div className="mt-10 max-w-xl">

          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-4">

            <span className="text-slate-500">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search learning platforms..."
              className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
            />

          </div>

        </div>


        {/* Categories */}
        <div className="mt-8 flex gap-3 overflow-x-auto pb-2">

          <button className="whitespace-nowrap rounded-full bg-blue-600 px-5 py-2 text-sm font-medium">
            All Platforms
          </button>

          <button className="whitespace-nowrap rounded-full border border-slate-800 px-5 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
            Coding
          </button>

          <button className="whitespace-nowrap rounded-full border border-slate-800 px-5 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
            Courses
          </button>

          <button className="whitespace-nowrap rounded-full border border-slate-800 px-5 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
            Documentation
          </button>

          <button className="whitespace-nowrap rounded-full border border-slate-800 px-5 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
            Practice
          </button>

        </div>


        {/* Platform Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {platforms.map((platform) => (

            <div
              key={platform.name}
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-900/80"
            >

              {/* Icon */}
              <div className="flex items-center justify-between">

                <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
                  {platform.icon}
                </div>

                <span className="text-slate-600 transition group-hover:text-blue-400">
                  ↗
                </span>

              </div>


              {/* Content */}
              <div className="mt-6">

                <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                  {platform.category}
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  {platform.name}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {platform.description}
                </p>

              </div>


              {/* Button */}
              <button className="mt-6 w-full rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-white">
                Explore Platform →
              </button>

            </div>

          ))}

        </div>


        {/* Recommended Section */}
        <section className="mt-16 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-8 md:p-10">

          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                StudySphere Recommendation
              </p>

              <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                Not sure where to start?
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Tell StudySphere what you're trying to learn and
                we'll help you find the right resources and create
                a learning path.
              </p>

            </div>

            <button className="rounded-full bg-blue-600 px-7 py-3 font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500">
              Get Recommendations →
            </button>

          </div>

        </section>


        {/* Saved Resources */}
        <section className="mt-10">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-xl font-semibold">
                Your Saved Resources
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Quickly access resources you've saved.
              </p>

            </div>

            <button className="text-sm text-blue-400 hover:text-blue-300">
              View all →
            </button>

          </div>


          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex flex-col items-center justify-center py-8 text-center">

              <div className="text-4xl">
                🔖
              </div>

              <h3 className="mt-4 font-semibold">
                No saved resources yet
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Save useful courses, documentation, and practice
                resources so you can find them quickly later.
              </p>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Platforms;