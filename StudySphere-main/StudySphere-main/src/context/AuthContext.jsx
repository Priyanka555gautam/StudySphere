import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authApi, ApiError } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Other providers (e.g. the focus timer) that own per-user, in-progress
  // work can register a handler here to flush/save that work while the
  // session cookie is still valid — i.e. before the logout request fires
  // and the account actually switches.
  const beforeLogoutHandlersRef = useRef(new Set());

  const registerBeforeLogout = (handler) => {
    beforeLogoutHandlersRef.current.add(handler);
    return () => {
      beforeLogoutHandlersRef.current.delete(handler);
    };
  };

  // On mount, ask the backend who — if anyone — the current session
  // cookie belongs to. This is the source of truth, not localStorage.
  useEffect(() => {
    let cancelled = false;

    authApi
      .me()
      .then(({ user: sessionUser }) => {
        if (!cancelled) setUser(sessionUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { user: loggedInUser } = await authApi.login({ email, password });
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed.";
      return { success: false, error: message };
    }
  };

  const signup = async (payload) => {
    try {
      const { user: newUser } = await authApi.signup(payload);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: err.message, fieldErrors: err.data?.errors };
      }
      return { success: false, error: "Signup failed." };
    }
  };

  const logout = async () => {
    // Give registered handlers (focus session flush, etc.) a chance to
    // save anything tied to the current account before the session
    // cookie is cleared. A handler failing shouldn't block sign-out.
    for (const handler of beforeLogoutHandlersRef.current) {
      try {
        await handler();
      } catch (err) {
        console.error("beforeLogout handler failed:", err);
      }
    }

    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (payload) => {
    try {
      const { user: updatedUser } = await authApi.updateProfile(payload);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update profile.";
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const data = await authApi.forgotPassword({ email });
      return { success: true, message: data?.message, devResetUrl: data?.devResetUrl };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const { user: loggedInUser } = await authApi.resetPassword({ token, password });
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not reset password.";
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updateProfile,
        forgotPassword,
        resetPassword,
        loading,
        isAuthenticated: !!user,
        registerBeforeLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
