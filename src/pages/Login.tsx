import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";

import { auth, isSignInWithEmailLink, useAuth } from "../lib/firebase";

type Mode = "login" | "register" | "magic";

const LoginPage = () => {
  const { user, signInWithEmail, register, sendMagicLink, completeMagicLink } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      setMode("magic");
      setMessage("Confirm your email to finish signing in.");
    }
  }, []);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setWorking(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setWorking(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setWorking(true);
    try {
      await register(displayName, email, password);
      setMessage("Account created. You are now signed in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register");
    } finally {
      setWorking(false);
    }
  };

  const handleSendMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setWorking(true);
    try {
      await sendMagicLink(magicEmail);
      setMessage(`Sign-in link sent to ${magicEmail}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send magic link");
    } finally {
      setWorking(false);
    }
  };

  const handleCompleteMagic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setWorking(true);
    try {
      await completeMagicLink(magicEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete sign-in");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">Dinbhar Poster Studio</h1>
          <p className="text-sm text-slate-500">Sign in with your newsroom credentials.</p>
        </div>
        <div className="flex justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <button
            type="button"
            className={`rounded-md px-3 py-1 ${mode === "login" ? "bg-brand-orange text-white" : "hover:bg-slate-100"}`}
            onClick={() => setMode("login")}
          >
            Email + password
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1 ${mode === "register" ? "bg-brand-orange text-white" : "hover:bg-slate-100"}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1 ${mode === "magic" ? "bg-brand-orange text-white" : "hover:bg-slate-100"}`}
            onClick={() => setMode("magic")}
          >
            Magic link
          </button>
        </div>

        {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}

        {mode === "login" ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-500 disabled:opacity-60"
              disabled={working}
            >
              {working ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : null}

        {mode === "register" ? (
          <form className="space-y-4" onSubmit={handleRegister}>
            <label className="block text-sm font-medium text-slate-700">
              Display name
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-500 disabled:opacity-60"
              disabled={working}
            >
              {working ? "Creating…" : "Create account"}
            </button>
          </form>
        ) : null}

        {mode === "magic" ? (
          <form className="space-y-4" onSubmit={isSignInWithEmailLink(auth, window.location.href) ? handleCompleteMagic : handleSendMagicLink}>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={magicEmail}
                onChange={(event) => setMagicEmail(event.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-500 disabled:opacity-60"
              disabled={working}
            >
              {isSignInWithEmailLink(auth, window.location.href)
                ? working
                  ? "Completing…"
                  : "Complete sign-in"
                : working
                  ? "Sending…"
                  : "Send magic link"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default LoginPage;
