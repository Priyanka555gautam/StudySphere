import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Home as HomeIcon,
  Bot,
  ArrowUp,
  Target,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Upload,
  Users,
  BarChart3,
} from "lucide-react";

/* =====================================================
   ANIMATED NUMBER
   Starts from 0 when the element enters the viewport
===================================================== */

function AnimatedNumber({
  target,
  suffix = "",
  duration = 3200,
}) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;

          const startTime = performance.now();

          const animate = (currentTime) => {
            const progress = Math.min(
              (currentTime - startTime) / duration,
              1
            );

            const easedProgress =
              1 - Math.pow(1 - progress, 3);

            setValue(
              Math.floor(easedProgress * target)
            );

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setValue(target);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      {
        threshold: 0.3,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value}{suffix}</span>;
}

function AnimatedProgress({
  target = 78,
  duration = 3200,
}) {
  const [progress, setProgress] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;

        started.current = true;

        const startTime = performance.now();

        const animate = (currentTime) => {
          const percentage = Math.min(
            (currentTime - startTime) / duration,
            1
          );

          const eased = 1 - Math.pow(1 - percentage, 3);
          const currentProgress = eased * target;

          setProgress(currentProgress);

          if (percentage < 1) {
            requestAnimationFrame(animate);
          } else {
            setProgress(target);
          }
        };

        requestAnimationFrame(animate);
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-center justify-between gap-5">

        <div className="flex-1">
          <p className="text-xs text-slate-500">
            Weekly completion
          </p>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="progress-fill h-full rounded-full bg-blue-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(
              rgb(59, 130, 246) ${progress}%,
              rgb(30, 41, 59) ${progress}%
            )`,
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950">
            <span className="text-sm font-semibold text-blue-400">
              {Math.floor(progress)}%
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
function AnimatedFocusProgress({
  target = 66,
  duration = 3200,
}) {
  const [progress, setProgress] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) {
          return;
        }

        started.current = true;

        const startTime = performance.now();

        const animate = (currentTime) => {
          const percentage = Math.min(
            (currentTime - startTime) / duration,
            1
          );

          const eased = 1 - Math.pow(1 - percentage, 3);

          setProgress(eased * target);

          if (percentage < 1) {
            requestAnimationFrame(animate);
          } else {
            setProgress(target);
          }
        };

        requestAnimationFrame(animate);
      },
      {
        threshold: 0.3,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div
      ref={ref}
      className="mt-10 h-2 w-full overflow-hidden rounded-full bg-slate-800"
    >
      <div
        className="progress-fill h-full rounded-full bg-blue-500"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}


function AnimatedFocusTimer({
  targetMinutes = 24,
  targetSeconds = 36,
  duration = 3200,
}) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const ref = useRef(null);
  const started = useRef(false);

  const targetTotalSeconds =
    targetMinutes * 60 + targetSeconds;

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) {
          return;
        }

        started.current = true;

        const startTime = performance.now();

        const animate = (currentTime) => {
          const percentage = Math.min(
            (currentTime - startTime) / duration,
            1
          );

          const eased =
            1 - Math.pow(1 - percentage, 3);

          const currentSeconds = Math.floor(
            eased * targetTotalSeconds
          );

          setSeconds(currentSeconds);

          if (percentage < 1) {
            requestAnimationFrame(animate);
          } else {
            setSeconds(targetTotalSeconds);
            setIsRunning(true);
          }
        };

        requestAnimationFrame(animate);
      },
      {
        threshold: 0.3,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [targetTotalSeconds, duration]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <span ref={ref}>
      {String(minutes).padStart(2, "0")}:
      {String(remainingSeconds).padStart(2, "0")}
    </span>
  );
}

/* =====================================================
   HOME
===================================================== */

function Home() {
  const [showTopButton, setShowTopButton] = useState(false);

  // Hero headline reveal animation
  const [headlineVisible, setHeadlineVisible] = useState(false);
  const headlineRef = useRef(null);

  // Section heading bounce animations
  const bounceHeadingRefs = useRef([]);

  const registerBounceHeading = (element) => {
    if (element && !bounceHeadingRefs.current.includes(element)) {
      bounceHeadingRefs.current.push(element);
    }
  };

  // AI Mentor live-chat animation
  const [chatStep, setChatStep] = useState(0);
  const aiChatRef = useRef(null);
  const chatStarted = useRef(false);

  /* =====================================================
     HERO HEADLINE REVEAL
     Starts when the headline enters the viewport
  ===================================================== */

  useEffect(() => {
    const element = headlineRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeadlineVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  /* =====================================================
     SECTION HEADING BOUNCE
  ===================================================== */

  useEffect(() => {
    const headings = bounceHeadingRefs.current;

    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              "scroll-bounce-heading-visible"
            );
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.25,
      }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  /* =====================================================
     BACK TO TOP VISIBILITY
  ===================================================== */

  useEffect(() => {
    const handleScroll = () => {
      setShowTopButton(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* =====================================================
     AI MENTOR LIVE CHAT ANIMATION
     Starts when the chat card enters the viewport
  ===================================================== */

  useEffect(() => {
    const element = aiChatRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !chatStarted.current) {
          chatStarted.current = true;

          // First AI message
          setTimeout(() => {
            setChatStep(1);
          }, 300);

          // Show typing indicator
          setTimeout(() => {
            setChatStep(2);
          }, 1600);

          // User message
          setTimeout(() => {
            setChatStep(3);
          }, 3000);

          // Show typing indicator again
          setTimeout(() => {
            setChatStep(4);
          }, 4200);

          // Final AI response
          setTimeout(() => {
            setChatStep(5);
          }, 5700);
        }
      },
      {
        threshold: 0.45,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  /* =====================================================
     BACK TO TOP
  ===================================================== */

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  return (
    <div className="page-enter min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden border-b border-slate-800">

        {/* Moving background - COLORS UNCHANGED */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb hero-orb-blue" />
          <div className="hero-orb hero-orb-purple" />
        </div>

        {/* Original background glows */}
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2">

          {/* LEFT */}

          <div>

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
              </span>
              Your smarter way to learn
            </div>

            <h1
              ref={headlineRef}
              className="hero-headline max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
            >

              <span
                className={`block transform-gpu transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${headlineVisible
                  ? "translate-y-0 opacity-100 blur-0"
                  : "translate-y-10 opacity-0 blur-sm"
                  }`}
              >
                Everything you need
              </span>

              <span
                className={`block text-slate-500 transform-gpu transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${headlineVisible
                  ? "translate-y-0 opacity-100 blur-0"
                  : "translate-y-10 opacity-0 blur-sm"
                  }`}
                style={{
                  transitionDelay: headlineVisible ? "180ms" : "0ms",
                }}
              >
                to learn better.
              </span>

              <span
                className={`text-gradient block transform-gpu transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${headlineVisible
                  ? "translate-y-0 opacity-100 blur-0"
                  : "translate-y-10 opacity-0 blur-sm"
                  }`}
                style={{
                  transitionDelay: headlineVisible ? "360ms" : "0ms",
                }}
              >
                All in one place.
              </span>

            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              StudySphere brings focused study sessions, AI guidance,
              organized resources, and meaningful progress tracking
              together into one learning platform.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">



              <Link
                to="/signup"
                className="hero-button btn-primary !rounded-full !px-7 !py-3.5"
              >
                Get Started →
              </Link>

            </div>

          </div>


          {/* RIGHT - Dashboard */}

          <div className="relative">

            <div className="dashboard-card rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">

              {/* Dashboard header */}

              <div className="flex items-center justify-between border-b border-slate-800 pb-6">

                <div>

                  <h3 className="mt-1 text-xl font-semibold">
                    Today's Learning
                  </h3>
                </div>

                <div className="rounded-xl bg-blue-500/10 px-3 py-2 text-sm text-blue-400">
                  <AnimatedNumber
                    target={78}
                    suffix="% complete"
                  />
                </div>

              </div>


              {/* Progress */}

              <div className="dashboard-card mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-500">
                      Weekly progress
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                      <AnimatedNumber target={12} suffix="h " />
                      <AnimatedNumber target={40} suffix="m" />
                    </p>

                  </div>




                </div>


                <div className="mt-5">
                  <AnimatedProgress
                    target={78}
                    duration={3200}
                  />
                </div>

              </div>


              {/* Two cards */}

              <div className="mt-5 grid grid-cols-2 gap-5">

                {/* Focus streak */}

                <div className="dashboard-card rounded-2xl border border-slate-800 bg-slate-950 p-6">

                  <p className="text-sm text-slate-500">
                    Focus streak
                  </p>

                  <p className="mt-4 text-2xl font-bold">
                    <AnimatedNumber target={14} /> days
                  </p>

                  <p className="mt-3 text-xs text-blue-400">
                    Keep going
                  </p>

                </div>


                {/* Tasks completed */}

                <div className="dashboard-card rounded-2xl border border-slate-800 bg-slate-950 p-6">

                  <p className="text-sm text-slate-500">
                    Tasks completed
                  </p>

                  <p className="mt-4 text-2xl font-bold">
                    <AnimatedNumber target={24} />
                  </p>

                  <p className="mt-3 text-xs text-emerald-400">
                    +18% this week
                  </p>

                </div>

              </div>


              {/* Tasks */}

              <div className="dashboard-card mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-6">

                <div className="flex items-center justify-between">

                  <p className="font-semibold">
                    Today's focus
                  </p>

                  <span className="text-xs text-slate-500">
                    <AnimatedNumber target={3} /> tasks
                  </span>

                </div>


                <div className="mt-5 space-y-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-xs">
                      ✓
                    </div>

                    <span className="text-sm text-slate-400">
                      Complete DSA practice
                    </span>

                  </div>


                  <div className="flex items-center gap-3">

                    <div className="h-5 w-5 rounded border border-slate-700" />

                    <span className="text-sm text-slate-400">
                      Revise React concepts
                    </span>

                  </div>


                  <div className="flex items-center gap-3">

                    <div className="h-5 w-5 rounded border border-slate-700" />

                    <span className="text-sm text-slate-400">
                      Complete focused study
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
    INTRO
===================================================== */}

      {/* =====================================================
    INTRO - COMPLETE YOUR STUDY
===================================================== */}

      <section className="border-b border-slate-800">

        <div className="mx-auto max-w-7xl px-6 py-28">

          {/* Section label */}

          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <span className="h-2 w-2 rounded-full bg-blue-900" />
            Complete Your Study
          </div>


          {/* TEXT + IMAGE */}

          <div className="grid items-center gap-16 md:grid-cols-2">

            {/* LEFT - TEXT */}

            <div className="flex flex-col justify-center">

              <h2
                ref={registerBounceHeading}
                className="scroll-bounce-heading text-4xl font-bold leading-[1.12] md:text-5xl lg:text-6xl"
              >
                A single platform

                <br />

                <span className="text-blue-400 text-3xl md:text-4xl lg:text-5xl ">
              Entire learning journey.
                </span>

                <br />

                
              </h2>
              <br/>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
                ...Learn together, share ideas, and grow with a community that keeps you moving forward.
              </p>

              {/* COMMUNITY BUTTON */}

              <div className="mt-8">
                <Link
                to="/community"
                className="rounded-full border border-slate-700 px-7 py-3.5 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900 hover:border-slate-600"
              >
                Explore Community →
              </Link>

              </div>

            </div>


            {/* RIGHT - IMAGE */}

            <div className="flex items-center justify-center md:justify-end">

              <div className="w-full max-w-lg">

                <img
                  src="/online.jpg"
                  alt="Online learning with StudySphere"
                  className="w-full object-contain"
                />

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          STUDENT / TEACHER
      ===================================================== */}

      <section className="border-b border-slate-800">

        <div className="mx-auto max-w-7xl px-6 py-28">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Built for everyone
            </p>

            <h2 className="mt-4 text-4xl font-bold md:text-5xl">
              One platform.
              <span className="text-slate-500">
                {" "}Two ways to grow.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Whether you're here to learn or teach, StudySphere gives
              you the tools to focus, grow, and make meaningful progress.
            </p>

          </div>


          <div className="mt-16 grid gap-6 md:grid-cols-2">

            {/* Student */}

            <div className="role-card group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">

              <div className="relative h-64 overflow-hidden bg-slate-950">

                <img
                  src="/student.png"
                  alt="Student using StudySphere"
                  className="role-image h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />

              </div>


              <div className="p-8">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <GraduationCap size={22} strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-blue-400">
                      STUDENT
                    </p>

                    <h3 className="text-2xl font-bold">
                      Learn. Focus. Grow.
                    </h3>
                  </div>

                </div>


                <p className="leading-7 text-slate-400">
                  Build better study habits, get help from your AI Mentor,
                  stay focused, track your progress, and learn from courses
                  created by teachers.
                </p>


                <div className="mt-8 grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    AI Mentor
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    Focus Sessions
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    Progress Tracking
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    Learn Courses
                  </div>

                </div>


                <Link
                  to="/signup/student"
                  className="role-link mt-8 inline-flex items-center font-semibold text-blue-400"
                >
                  Start as Student
                  <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>

              </div>

            </div>


            {/* Teacher */}

            <div className="role-card group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">

              <div className="relative h-64 overflow-hidden bg-slate-950">

                <img
                  src="/teacher.png"
                  alt="Teacher using StudySphere"
                  className="role-image h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />

              </div>


              <div className="p-8">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <GraduationCap size={22} strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-purple-400">
                      TEACHER
                    </p>

                    <h3 className="text-2xl font-bold">
                      Create. Teach. Inspire.
                    </h3>
                  </div>

                </div>


                <p className="leading-7 text-slate-400">
                  Create your own courses, upload learning material,
                  manage your content, and help students learn while
                  enjoying the same StudySphere tools.
                </p>


                <div className="mt-8 grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    AI Mentor
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    Create Courses
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    Upload Content
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                    Manage Students
                  </div>

                </div>


                <Link
                  to="/signup/teacher"
                  className="role-link mt-8 inline-flex items-center font-semibold text-purple-400"
                >
                  Start as Teacher
                  <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURE 1 - FOCUS
      ===================================================== */}

      <section className="border-b border-slate-800">

        <div className="mx-auto grid max-w-7xl md:grid-cols-2">

          {/* Text */}

          <div className="border-r border-slate-800 px-6 py-24 md:px-14">

            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-blue-400">
              Focus
            </p>

            <h2 className="text-3xl font-bold md:text-4xl">

              Turn study time into

              <br />

              meaningful progress.

            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">

              Create focused sessions, eliminate distractions, and
              build a study routine that actually works for you.

            </p>

            <div className="mt-10 space-y-4">

              <div className="flex gap-4">

                <span className="text-blue-400">
                  01
                </span>

                <div>

                  <h3 className="font-semibold">
                    Focus sessions
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Study with structured sessions and timers.
                  </p>

                </div>

              </div>


              <div className="flex gap-4">

                <span className="text-blue-400">
                  02
                </span>

                <div>

                  <h3 className="font-semibold">
                    Smart planning
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Decide what deserves your attention next.
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* Visual */}

          <div className="flex items-center justify-center bg-slate-950 p-10">

            <div className="dashboard-card w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6">

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Focus Session
                </span>

                <span className="flex items-center gap-2 text-sm text-blue-400">
                  <span
                    className="h-2 w-2 rounded-full bg-red-500"
                    aria-hidden="true"
                  />
                  ACTIVE
                </span>

              </div>


              <div className="mt-10 text-center">

                <p className="text-6xl font-bold">
                  <AnimatedFocusTimer
                    targetMinutes={24}
                    targetSeconds={36}
                    duration={3200}
                  />
                </p>

                <p className="mt-3 text-slate-500">
                  Deep Work Session
                </p>

              </div>


              <AnimatedFocusProgress
                target={66}
                duration={3200}
              />


              <button className="hero-button btn-primary mt-8 w-full !rounded-xl">
                Stay Focused
              </button>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURE 2 - AI MENTOR
      ===================================================== */}

      <section className="border-b border-slate-800">

        <div className="mx-auto grid max-w-7xl md:grid-cols-2">

          {/* Visual first */}

          <div className="order-2 flex items-center justify-center border-r border-slate-800 bg-slate-950 p-10 md:order-1">

            <div
              ref={aiChatRef}
              className="dashboard-card w-full max-w-lg rounded-3xl border border-indigo-500/20 bg-slate-900 p-6"
            >

              {/* AI Header */}
              <div className="flex items-center gap-4">

                <div
                  className="ai-icon flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400"
                  aria-label="StudySphere AI Mentor"
                >
                  <Bot size={24} strokeWidth={1.8} />
                </div>

                <div>
                  <h3 className="font-semibold">
                    StudySphere AI Mentor
                  </h3>

                  <p className="text-sm text-slate-500">
                    Online
                  </p>
                </div>

              </div>


              {/* Live Chat */}

              <div className="mt-8 space-y-4">

                {/* First AI message */}
                <div
                  className={`chat-message ai-message ${chatStep >= 1 ? "chat-visible" : ""
                    }`}
                >
                  What are you studying today?
                </div>


                {/* Typing after first AI message */}
                {chatStep === 2 && (
                  <div className="typing-indicator ai-message">
                    <span />
                    <span />
                    <span />
                  </div>
                )}


                {/* User message */}
                <div
                  className={`chat-message user-message ml-auto ${chatStep >= 3 ? "chat-visible" : ""
                    }`}
                >
                  I want to prepare DSA and improve my problem solving.
                </div>


                {/* Typing after user message */}
                {chatStep === 4 && (
                  <div className="typing-indicator ai-message">
                    <span />
                    <span />
                    <span />
                  </div>
                )}


                {/* Final AI message */}
                <div
                  className={`chat-message ai-message ${chatStep >= 5 ? "chat-visible" : ""
                    }`}
                >
                  Great. Let's create a focused 7-day plan for you.
                </div>

              </div>

            </div>

          </div>


          {/* Text */}

          <div className="order-1 px-6 py-24 md:order-2 md:px-14">

            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-indigo-400">
              AI Mentor
            </p>

            <h2 className="text-3xl font-bold md:text-4xl">

              Your personal

              <br />

              study companion.

            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-400">

              Don't know what to study next? Your AI Mentor can help
              break down difficult concepts, create study plans,
              explain topics, and keep you moving forward.

            </p>

            <Link
              to="/ai-mentor"
              className="mt-8 inline-block text-indigo-400 transition-all duration-300 hover:-translate-y-1 hover:text-indigo-300"
            >
              Explore AI Mentor →
            </Link>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURE GRID - STUDENTS
      ===================================================== */}

      <section className="border-b border-slate-800">

        <div className="mx-auto max-w-7xl px-6 py-28">

          {/* Student heading */}

          <div className="max-w-2xl">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Built for students
            </p>

            <h2 ref={registerBounceHeading}
              className="scroll-bounce-heading mt-4 text-4xl font-bold md:text-5xl">
              Everything you need
              <span className="text-slate-500">
                {" "}to learn better.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
              StudySphere brings your focus, planning, AI guidance,
              resources, and progress together in one place.
            </p>

          </div>


          {/* Student features */}

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-slate-800 bg-slate-800 md:grid-cols-2">

            <div className="feature-card bg-slate-950 p-9">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Bot size={22} strokeWidth={1.8} />
              </span>

              <h3 className="mt-5 text-2xl font-bold">
                AI Mentor
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Get personalized explanations, study plans, and
                guidance whenever you need help.
              </p>

            </div>


            <div className="feature-card bg-slate-950 p-9">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Target size={22} strokeWidth={1.8} />
              </span>

              <h3 className="mt-5 text-2xl font-bold">
                Focus Sessions
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Create focused study sessions, eliminate distractions,
                and build consistent learning habits.
              </p>

            </div>


            <div className="feature-card bg-slate-950 p-9">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <TrendingUp size={22} strokeWidth={1.8} />
              </span>

              <h3 className="mt-5 text-2xl font-bold">
                Track Progress
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Track study time, streaks, completed tasks, and
                your overall learning progress.
              </p>

            </div>


            <div className="feature-card bg-slate-950 p-9">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <BookOpen size={22} strokeWidth={1.8} />
              </span>

              <h3 className="mt-5 text-2xl font-bold">
                Learning Resources
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Access courses, notes, documentation, videos, and
                other resources from one organized platform.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURE GRID - TEACHERS
      ===================================================== */}

      <section className="border-b border-slate-800">

        <div className="mx-auto max-w-7xl px-6 py-28">

          {/* Teacher heading */}

          <div className="max-w-2xl">

            <p className="text-sm font-semibold uppercase tracking-widest text-purple-400">
              Built for teachers
            </p>

            <h2 ref={registerBounceHeading}
              className="scroll-bounce-heading mt-4 text-4xl font-bold md:text-5xl">
              Teach smarter.
              <span className="text-slate-500">
                {" "}Reach further.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
              Create courses, share knowledge, manage learning content,
              and help students grow — all from one platform.
            </p>
            <br/>

          </div>


          {/* Teacher features */}

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-slate-800 bg-slate-800 md:grid-cols-2">

            <div className="feature-card bg-slate-950 p-9">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <GraduationCap size={22} strokeWidth={1.8} />
              </span>

              <h3 className="mt-5 text-2xl font-bold">
                Create Courses
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Create structured courses and organize your knowledge
                into lessons that students can easily follow.
              </p>

            </div>


            <div className="feature-card bg-slate-950 p-9">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Upload size={22} strokeWidth={1.8} />
              </span>

              <h3 className="mt-5 text-2xl font-bold">
                Upload Learning Content
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Upload notes, videos, resources, assignments, and
                other learning material directly to your courses.
              </p>

            </div>


            <div className="feature-card bg-slate-950 p-9">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Users size={22} strokeWidth={1.8} />
              </span>

              <h3 className="mt-5 text-2xl font-bold">
                Manage Students
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Organize your learners and provide them with
                structured content and learning experiences.
              </p>

            </div>


            <div className="feature-card bg-slate-950 p-9">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <BarChart3 size={22} strokeWidth={1.8} />
              </span>

              <h3 className="mt-5 text-2xl font-bold">
                Teaching Insights
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Understand how your courses are being used and gain
                insights that can help improve the learning experience.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="relative overflow-hidden">

        {/* Original colors preserved */}
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl moving-cta-glow" />

        <div className="relative mx-auto max-w-4xl px-6 py-32 text-center">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Start your journey
          </p>

          <h2 className="mt-5 text-4xl font-bold md:text-6xl">

            Study <span className=" text-blue-400">
              Smarter.
            </span>

            <br />
            <span className=" text-slate-400">
              Build your future.
            </span>


          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-400">

            Everything you need to stay focused, organized,
            and consistent — all in one place.

          </p>

          {/* <Link
            to="/signup"
            className="hero-button btn-primary mt-9 inline-block !rounded-full !px-8 !py-4"
          >
            Get Started with StudySphere →
          </Link> */}

        </div>

      </section>


      {/* =====================================================
          BACK TO TOP BUTTON
      ===================================================== */}

      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
        className={`back-to-top ${showTopButton
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-5 opacity-0"
          }`}
      >
        <ArrowUp size={20} strokeWidth={2.2} />
      </button>

    </div>
  );
}

export default Home;