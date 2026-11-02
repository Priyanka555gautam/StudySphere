import { createContext, useContext, useState, useEffect, useRef } from "react";
import { focusApi } from "../lib/api";
import { useAuth } from "./AuthContext";

const FocusContext = createContext(null);

const DEFAULT_MINUTES = 25;
const MIN_SAVE_SECONDS = 30; // don't bother logging near-zero sessions

const storageKeyFor = (userId) => `focusSession:${userId}`;

export function FocusProvider({ children }) {
  const { user, loading: authLoading, registerBeforeLogout } = useAuth();

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES * 60);
  const [initialMinutes, setInitialMinutes] = useState(DEFAULT_MINUTES);
  const [sessionTitle, setSessionTitle] = useState("Focus Session");
  const [focusDrawerOpen, setFocusDrawerOpen] = useState(false);

  const timerRef = useRef(null);

  // Which account the in-memory timer state currently belongs to. This is
  // the source of truth for "whose time is this" — separate from `user`,
  // so we can tell the difference between "still the same person" and
  // "the account just changed underneath this running timer".
  const ownerIdRef = useRef(null);

  // Keep the latest values in a ref so the logout-flush handler
  // (registered once) always sees current state instead of a stale
  // closure. Synced in an effect, not during render.
  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = { isTimerRunning, secondsLeft, initialMinutes, sessionTitle };
  }, [isTimerRunning, secondsLeft, initialMinutes, sessionTitle]);

  const resetToIdle = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setSecondsLeft(DEFAULT_MINUTES * 60);
    setInitialMinutes(DEFAULT_MINUTES);
    setSessionTitle("Focus Session");
    setFocusDrawerOpen(false);
  };

  // Saves whatever progress the currently-owned timer has made, for the
  // account it belongs to, then clears it locally. Safe to call whether
  // the timer is running, paused, or already idle.
  const flushOwnedSession = async () => {
    const ownerId = ownerIdRef.current;
    if (!ownerId) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const { isTimerRunning: wasRunning, secondsLeft: left, initialMinutes: mins } = stateRef.current;
    localStorage.removeItem(storageKeyFor(ownerId));

    const elapsedSeconds = mins * 60 - left;
    if ((wasRunning || elapsedSeconds > 0) && elapsedSeconds >= MIN_SAVE_SECONDS) {
      try {
        await focusApi.logSession({ seconds: elapsedSeconds, mode: "Focus" });
      } catch (err) {
        console.error("Failed to save focus session before switching accounts:", err);
      }
    }

    ownerIdRef.current = null;
  };

  // Register the flush so AuthContext.logout() runs it — while the
  // session cookie is still valid — before it actually signs out.
  useEffect(() => {
    if (!registerBeforeLogout) return undefined;
    return registerBeforeLogout(flushOwnedSession);
  }, [registerBeforeLogout]);

  // React to the resolved identity changing: once auth has finished
  // loading, either restore this user's own saved-in-progress session,
  // or — if a timer is still marked as owned by someone else (e.g. the
  // account changed without going through the normal logout flow) —
  // drop it rather than let it bleed into the new account.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      resetToIdle();
      ownerIdRef.current = null;
      return;
    }

    if (ownerIdRef.current && ownerIdRef.current !== user.id) {
      resetToIdle();
      ownerIdRef.current = null;
    }

    if (localStorage.getItem("autoOpenFocus") === "true") {
      localStorage.removeItem("autoOpenFocus");
      setFocusDrawerOpen(true);
    }

    const saved = localStorage.getItem(storageKeyFor(user.id));
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.isTimerRunning && data.endTime) {
          const remaining = Math.max(0, Math.floor((data.endTime - Date.now()) / 1000));
          setSecondsLeft(remaining);
          setInitialMinutes(data.initialMinutes || DEFAULT_MINUTES);
          setSessionTitle(data.sessionTitle || "Focus Session");
          if (remaining > 0) {
            setIsTimerRunning(true);
            ownerIdRef.current = user.id;
          } else {
            localStorage.removeItem(storageKeyFor(user.id));
          }
        }
      } catch (e) {
        console.error("Failed to restore focus session:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // Timer interval handling
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            if (ownerIdRef.current) {
              localStorage.removeItem(storageKeyFor(ownerIdRef.current));
            }
            // Automatically log the completed session for whoever owns it.
            focusApi
              .logSession({ seconds: initialMinutes * 60, mode: "Focus" })
              .catch(console.error);
            ownerIdRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, initialMinutes]);

  const startFocusTimer = (minutes = DEFAULT_MINUTES, title = "Focus Session") => {
    if (!user) return; // no one signed in — nothing to attribute this to

    const secs = minutes * 60;
    ownerIdRef.current = user.id;
    setInitialMinutes(minutes);
    setSecondsLeft(secs);
    setSessionTitle(title);
    setIsTimerRunning(true);

    const endTime = Date.now() + secs * 1000;
    localStorage.setItem(
      storageKeyFor(user.id),
      JSON.stringify({ isTimerRunning: true, endTime, initialMinutes: minutes, sessionTitle: title })
    );
  };

  const pauseFocusTimer = () => {
    if (!user) return;
    setIsTimerRunning(false);
    localStorage.removeItem(storageKeyFor(user.id));
  };

  const resumeFocusTimer = () => {
    if (!user || secondsLeft <= 0) return;
    ownerIdRef.current = user.id;
    setIsTimerRunning(true);
    const endTime = Date.now() + secondsLeft * 1000;
    localStorage.setItem(
      storageKeyFor(user.id),
      JSON.stringify({ isTimerRunning: true, endTime, initialMinutes, sessionTitle })
    );
  };

  const stopFocusTimer = async () => {
    if (!user) return;

    setIsTimerRunning(false);
    localStorage.removeItem(storageKeyFor(user.id));

    const elapsedSeconds = initialMinutes * 60 - secondsLeft;

    if (elapsedSeconds >= MIN_SAVE_SECONDS) {
      try {
        await focusApi.logSession({ seconds: elapsedSeconds, mode: "Focus" });
      } catch (err) {
        console.error("Failed to save focus session:", err);
      }
    }

    ownerIdRef.current = null;
    setSecondsLeft(initialMinutes * 60);
  };

  return (
    <FocusContext.Provider
      value={{
        isSignedIn: !!user,
        isTimerRunning,
        secondsLeft,
        initialMinutes,
        sessionTitle,
        focusDrawerOpen,
        setFocusDrawerOpen,
        startFocusTimer,
        pauseFocusTimer,
        resumeFocusTimer,
        stopFocusTimer,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
}
