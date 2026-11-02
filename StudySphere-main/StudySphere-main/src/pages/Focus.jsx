import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Square,
  Timer as TimerIcon,
  Watch,
  Flame,
} from "lucide-react";

import { focusApi } from "../lib/api";

/* =====================================================
   FORMAT HELPERS
===================================================== */

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatStopwatch(ms) {
  const totalCentis = Math.floor(ms / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60);

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

const PRESETS = [15, 25, 45, 60];

/* =====================================================
   FOCUS PAGE
===================================================== */

const EMPTY_STATS = {
  today: { seconds: 0, sessions: 0 },
  weekSeconds: 0,
  allTimeSeconds: 0,
  allTimeSessions: 0,
  streakDays: 0,
  dailyHistory: [],
};

function Focus() {
  const [mode, setMode] = useState("timer"); // "timer" | "stopwatch"
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshStats = () => {
    focusApi
      .stats()
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch(() => setError("Couldn't load your focus stats."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshStats();
  }, []);

  // Logs a completed/stopped session to the backend (per-user, per-day)
  // and refreshes stats so today's total, the streak, and the day-by-day
  // history all reflect the real record instead of a hardcoded number.
  const addFocusTime = (seconds, sessionMode) => {
    if (seconds <= 0) return;

    focusApi
      .logSession({ seconds, mode: sessionMode })
      .then(refreshStats)
      .catch(() => setError("Couldn't save that session — check your connection."));
  };

  return (
    <div className="page-enter min-h-screen bg-slate-950 px-6 py-16 text-white">

      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Focus
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Stay focused.
          </h1>

          <p className="mt-3 max-w-xl text-slate-400">
            Run a countdown timer or a free-form stopwatch — every minute
            you log is saved to your focus totals.
          </p>
        </div>

        {/* Mode switch */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-slate-800 bg-slate-900 p-1.5">
            <button
              type="button"
              onClick={() => setMode("timer")}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${mode === "timer"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "text-slate-400 hover:text-white"
                }`}
            >
              <TimerIcon size={16} />
              Timer
            </button>

            <button
              type="button"
              onClick={() => setMode("stopwatch")}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${mode === "stopwatch"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "text-slate-400 hover:text-white"
                }`}
            >
              <Watch size={16} />
              Stopwatch
            </button>
          </div>
        </div>

        {/* Timer / Stopwatch */}
        <div className="mt-8 flex justify-center">
          {mode === "timer" ? (
            <FocusTimer onComplete={(secs) => addFocusTime(secs, "timer")} />
          ) : (
            <FocusStopwatch onBank={(secs) => addFocusTime(secs, "stopwatch")} />
          )}
        </div>

        {error && (
          <p className="mt-6 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Stats */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="dashboard-card stagger-in stagger-1 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">
              Today's Focus
            </p>

            <p className="mt-3 text-3xl font-bold">
              {loading ? "—" : formatDuration(stats.today.seconds)}
            </p>
          </div>


          <div className="dashboard-card stagger-in stagger-2 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Focus Streak
              </p>
              <Flame size={18} className="text-orange-400" />
            </div>

            <p className="mt-3 text-3xl font-bold">
              {loading ? "—" : stats.streakDays}
              <span className="ml-1 text-base font-normal text-slate-500">days</span>
            </p>
          </div>


          <div className="dashboard-card stagger-in stagger-3 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">
              This Week
            </p>

            <p className="mt-3 text-3xl font-bold">
              {loading ? "—" : formatDuration(stats.weekSeconds)}
            </p>
          </div>


          <div className="dashboard-card stagger-in stagger-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">
              All-Time Focus
            </p>

            <p className="mt-3 text-3xl font-bold">
              {loading ? "—" : formatDuration(stats.allTimeSeconds)}
            </p>
          </div>

        </div>

        {/* Day-by-day history */}
        {!loading && stats.dailyHistory.length > 0 && (
          <div className="dashboard-card mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">
              Last 14 Days
            </p>

            <div className="mt-6 flex items-end gap-2" style={{ height: 140 }}>
              {(() => {
                const maxSeconds = Math.max(...stats.dailyHistory.map((d) => d.seconds), 1);

                return stats.dailyHistory.map((day) => {
                  const heightPct = Math.max(4, Math.round((day.seconds / maxSeconds) * 100));
                  const label = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "narrow",
                  });

                  return (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-full w-full items-end">
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${day.seconds > 0 ? "bg-gradient-to-t from-blue-600 to-indigo-500" : "bg-slate-800"
                            }`}
                          style={{ height: `${heightPct}%` }}
                          title={`${day.date}: ${formatDuration(day.seconds)}`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-600">
                        {label}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

/* =====================================================
   COUNTDOWN TIMER
   - Preset durations + custom minutes
   - Circular progress ring
   - Banks elapsed time on finish OR on manual "End Session"
===================================================== */

function FocusTimer({ onComplete }) {
  const [durationMin, setDurationMin] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const intervalRef = useRef(null);

  const totalSeconds = durationMin * 60;
  const progress = 1 - remaining / totalSeconds;

  const RADIUS = 120;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  useEffect(() => {
    if (!isRunning) return undefined;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setHasStarted(false);
          onComplete(totalSeconds);
          return totalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const selectPreset = (minutes) => {
    if (isRunning) return;
    setDurationMin(minutes);
    setRemaining(minutes * 60);
    setHasStarted(false);
  };

  const handleStartPause = () => {
    setHasStarted(true);
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    setRemaining(durationMin * 60);
  };

  const handleEndSession = () => {
    const elapsed = totalSeconds - remaining;
    setIsRunning(false);
    setHasStarted(false);
    setRemaining(durationMin * 60);
    if (elapsed > 0) onComplete(elapsed);
  };

  return (
    <div className="glass-panel w-full max-w-xl rounded-3xl p-10 text-center">

      <p className="text-sm text-slate-500">
        Deep Work Session
      </p>

      {/* Preset selector */}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {PRESETS.map((mins) => (
          <button
            key={mins}
            type="button"
            onClick={() => selectPreset(mins)}
            disabled={isRunning}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${durationMin === mins
              ? "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/40"
              : "text-slate-500 hover:bg-white/5 hover:text-white"
              }`}
          >
            {mins}m
          </button>
        ))}
      </div>

      {/* Circular progress ring */}
      <div className="relative mx-auto mt-8 flex h-[260px] w-[260px] items-center justify-center">
        <svg
          viewBox="0 0 260 260"
          className="absolute inset-0 -rotate-90"
        >
          <circle
            cx="130"
            cy="130"
            r={RADIUS}
            fill="none"
            stroke="rgba(148, 163, 184, 0.12)"
            strokeWidth="10"
          />
          <circle
            cx="130"
            cy="130"
            r={RADIUS}
            fill="none"
            stroke="url(#focusGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
          <defs>
            <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        <div>
          <div className="font-mono text-6xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
            {formatClock(remaining)}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {isRunning ? "Stay focused…" : hasStarted ? "Paused" : "Ready when you are."}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-9 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary !px-4 !py-3"
          aria-label="Reset timer"
        >
          <RotateCcw size={18} />
        </button>

        <button
          type="button"
          onClick={handleStartPause}
          className="btn-primary !px-9 !py-3.5"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? "Pause" : hasStarted ? "Resume" : "Start Session"}
        </button>

        {hasStarted && (
          <button
            type="button"
            onClick={handleEndSession}
            className="btn-secondary !px-4 !py-3"
            aria-label="End session and save"
          >
            <Square size={18} />
          </button>
        )}
      </div>

    </div>
  );
}

/* =====================================================
   STOPWATCH
   - Free-running count up, accurate via Date.now() deltas
   - Lap tracking with per-lap split time
   - Banks elapsed time when stopped/reset
===================================================== */

function FocusStopwatch({ onBank }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null); // performance timestamp of latest resume
  const baseElapsedRef = useRef(0);  // elapsed accumulated before latest resume

  useEffect(() => {
    if (!isRunning) return undefined;

    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setElapsedMs(baseElapsedRef.current + (Date.now() - startTimeRef.current));
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStartPause = () => {
    if (isRunning) {
      baseElapsedRef.current = elapsedMs;
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  const handleLap = () => {
    if (!isRunning) return;

    setLaps((prev) => {
      const prevTotal = prev.length > 0 ? prev[0].totalMs : 0;
      const lap = {
        id: prev.length + 1,
        splitMs: elapsedMs - prevTotal,
        totalMs: elapsedMs,
      };
      return [lap, ...prev];
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    if (elapsedMs > 0) {
      onBank(Math.round(elapsedMs / 1000));
    }
    setElapsedMs(0);
    baseElapsedRef.current = 0;
    setLaps([]);
  };

  const fastestLapId = laps.length > 1
    ? laps.reduce((min, l) => (l.splitMs < min.splitMs ? l : min), laps[0]).id
    : null;

  const slowestLapId = laps.length > 1
    ? laps.reduce((max, l) => (l.splitMs > max.splitMs ? l : max), laps[0]).id
    : null;

  return (
    <div className="glass-panel w-full max-w-xl rounded-3xl p-10 text-center">

      <p className="text-sm text-slate-500">
        Free Focus Session
      </p>

      <div className="mt-8">
        <div className="font-mono text-6xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
          {formatStopwatch(elapsedMs)}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          {isRunning ? "Running…" : elapsedMs > 0 ? "Paused" : "Ready when you are."}
        </p>
      </div>

      {/* Controls */}
      <div className="mt-9 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleLap}
          disabled={!isRunning}
          className="btn-secondary !px-4 !py-3 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Record lap"
        >
          <Flag size={18} />
        </button>

        <button
          type="button"
          onClick={handleStartPause}
          className="btn-primary !px-9 !py-3.5"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? "Pause" : elapsedMs > 0 ? "Resume" : "Start"}
        </button>

        <button
          type="button"
          onClick={handleStop}
          disabled={elapsedMs === 0}
          className="btn-secondary !px-4 !py-3 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Stop and save total"
        >
          <Square size={18} />
        </button>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="mt-8 max-h-64 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 text-left">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-950">
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="px-4 py-3 font-medium">Lap</th>
                <th className="px-4 py-3 font-medium">Split</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap) => (
                <tr key={lap.id} className="border-b border-slate-900 last:border-0">
                  <td className="px-4 py-2.5 text-slate-400">
                    #{lap.id}
                  </td>
                  <td
                    className={`px-4 py-2.5 font-mono ${lap.id === fastestLapId
                      ? "text-emerald-400"
                      : lap.id === slowestLapId
                        ? "text-orange-400"
                        : "text-white"
                      }`}
                  >
                    {formatStopwatch(lap.splitMs)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">
                    {formatStopwatch(lap.totalMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-600">
        Stopping the stopwatch saves the elapsed time to your focus totals.
      </p>

    </div>
  );
}

export default Focus;
