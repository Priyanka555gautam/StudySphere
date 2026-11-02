import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useFocus } from "../../context/FocusContext";
import { Timer, Play, Pause, Square, X, Minimize2, Maximize2, Move, LogIn } from "lucide-react";

export default function FocusWidget() {
  const {
    isSignedIn,
    isTimerRunning,
    secondsLeft,
    initialMinutes,
    sessionTitle,
    focusDrawerOpen,
    setFocusDrawerOpen,
    startFocusTimer,
    pauseFocusTimer,
    stopFocusTimer,
  } = useFocus();

  const [customMinutes, setCustomMinutes] = useState(25);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState(null); // { left: number, top: number }
  const [isDragging, setIsDragging] = useState(false);

  const widgetRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, initialLeft: 0, initialTop: 0 });

  const snapToNearestCorner = (currentLeft, currentTop) => {
    const marginX = 20;
    const navHeight = 76; // Below top navigation bar
    const width = widgetRef.current?.offsetWidth || 290;
    const height = widgetRef.current?.offsetHeight || 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const corners = [
      { left: marginX, top: navHeight }, // Top-Left (below nav)
      { left: Math.max(marginX, vw - width - marginX), top: navHeight }, // Top-Right (below nav)
      { left: marginX, top: Math.max(navHeight, vh - height - 20) }, // Bottom-Left
      { left: Math.max(marginX, vw - width - marginX), top: Math.max(navHeight, vh - height - 20) }, // Bottom-Right
    ];

    let closest = corners[0];
    let minDistance = Infinity;

    for (const corner of corners) {
      const dist = Math.hypot(currentLeft - corner.left, currentTop - corner.top);
      if (dist < minDistance) {
        minDistance = dist;
        closest = corner;
      }
    }

    setPos(closest);
  };

  const handlePointerDown = (e) => {
    if (e.target.closest("button") || e.target.closest("input")) return;
    if (!widgetRef.current) return;

    const rect = widgetRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    };

    setIsDragging(true);

    const onPointerMove = (moveEvt) => {
      const dx = moveEvt.clientX - dragStartRef.current.x;
      const dy = moveEvt.clientY - dragStartRef.current.y;
      setPos({
        left: dragStartRef.current.initialLeft + dx,
        top: dragStartRef.current.initialTop + dy,
      });
    };

    const onPointerUp = (upEvt) => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      setIsDragging(false);

      const dx = upEvt.clientX - dragStartRef.current.x;
      const dy = upEvt.clientY - dragStartRef.current.y;
      const finalLeft = dragStartRef.current.initialLeft + dx;
      const finalTop = dragStartRef.current.initialTop + dy;

      snapToNearestCorner(finalLeft, finalTop);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPct = Math.round(
    ((initialMinutes * 60 - secondsLeft) / (initialMinutes * 60)) * 100
  );

  const dynamicStyle = pos
    ? {
        position: "fixed",
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        bottom: "auto",
        right: "auto",
        transition: isDragging ? "none" : "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }
    : undefined;

  // If timer is not running and drawer is not manually opened, show floating trigger badge
  if (!isTimerRunning && !focusDrawerOpen) {
    return (
      <button
        type="button"
        onClick={() => setFocusDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-blue-500/30 bg-slate-900/90 px-3.5 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:bg-slate-800"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
          <Timer size={14} />
        </div>
        <span>Focus Mode</span>
      </button>
    );
  }

  // Minimized floating badge when timer is active
  if (minimized && isTimerRunning) {
    return (
      <div
        ref={widgetRef}
        onPointerDown={handlePointerDown}
        style={dynamicStyle}
        className="fixed bottom-6 right-6 z-50 flex cursor-grab active:cursor-grabbing items-center gap-2.5 rounded-xl border border-blue-500/40 bg-slate-950/95 p-2.5 shadow-2xl backdrop-blur-xl animate-fade-in select-none"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 font-mono font-bold text-xs">
          {formatTime(secondsLeft)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white max-w-[110px]">{sessionTitle}</p>
          <p className="text-[10px] text-blue-400 font-medium">Drag to move</p>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      onPointerDown={handlePointerDown}
      style={dynamicStyle}
      className="fixed bottom-6 right-6 z-50 w-full max-w-[280px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 select-none cursor-grab active:cursor-grabbing"
    >
      {/* Drag Handle Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3 cursor-grab">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Move size={13} className="text-blue-400" />
          <span>Drag to snap below nav</span>
        </div>
        <div className="flex items-center gap-1">
          {isTimerRunning && (
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-900 hover:text-white"
              title="Minimize"
            >
              <Minimize2 size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setFocusDrawerOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-900 hover:text-white"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
          <Timer size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-white text-sm truncate">Focus Mode</h3>
          <p className="text-[11px] text-slate-400 truncate">{sessionTitle}</p>
        </div>
      </div>

      {!isSignedIn ? (
        <>
          {/* Signed-out state: nothing to run or attribute time to yet */}
          <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-4 text-center">
            <p className="text-xs text-slate-400">
              Sign in to start a focus session — your time is tracked per
              account, so we need to know who's studying.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Link
              to="/login"
              onClick={() => setFocusDrawerOpen(false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
            >
              <LogIn size={14} />
              Log In
            </Link>
            <Link
              to="/signup"
              onClick={() => setFocusDrawerOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Sign Up
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Timer display */}
          <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 text-center">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-white">
              {formatTime(secondsLeft)}
            </span>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="mt-1.5 text-[11px] font-medium text-slate-400">
              {progressPct}% &bull; {initialMinutes}m target
            </span>
          </div>

          {/* Preset selection (if timer not running) */}
          {!isTimerRunning && (
            <div className="mt-3">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Select Duration
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[15, 25, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setCustomMinutes(mins)}
                    className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                      customMinutes === mins
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {!isTimerRunning ? (
              <button
                type="button"
                onClick={() => startFocusTimer(customMinutes, "Custom Study Session")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
              >
                <Play size={14} />
                Start Focus
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={pauseFocusTimer}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  <Pause size={14} />
                  Pause
                </button>
                <button
                  type="button"
                  onClick={stopFocusTimer}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                >
                  <Square size={14} />
                  Stop & Save
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
