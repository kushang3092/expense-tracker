"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetAuthUi,
  setAuthError,
  setAuthLoading,
  setAuthMode,
} from "@/store/slices/authUiSlice";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export function AuthPanel() {
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { mode, loading, error } = useAppSelector((state) => state.authUi);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(""));

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      if (mode === "register") {
        const registerResponse = await fetch(`${apiUrl}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!registerResponse.ok) {
          const payload = await registerResponse.json().catch(() => ({}));
          throw new Error(payload.message || "Unable to create account.");
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password.");
      }

      dispatch(resetAuthUi());
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      dispatch(setAuthError(submitError instanceof Error ? submitError.message : "Something went wrong."));
    } finally {
      dispatch(setAuthLoading(false));
    }
  }

  return (
    <div className="grid min-w-0 gap-5 rounded-[2rem] border border-white/50 bg-white/80 p-4 shadow-[0_30px_80px_rgba(12,34,36,0.16)] backdrop-blur sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-teal-700 sm:text-sm sm:tracking-[0.3em]">Access</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">Track money with clarity</h2>
        </div>
        {session ? (
          <Link
            href="/dashboard"
            className="inline-flex justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Open dashboard
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm sm:rounded-full">
        <button
          type="button"
          onClick={() => dispatch(setAuthMode("login"))}
          className={`rounded-2xl px-3 py-2 transition sm:rounded-full sm:px-4 ${mode === "login" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
        >
          Email login
        </button>
        <button
          type="button"
          onClick={() => dispatch(setAuthMode("register"))}
          className={`rounded-2xl px-3 py-2 transition sm:rounded-full sm:px-4 ${mode === "register" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {mode === "register" ? (
          <input
            name="name"
            placeholder="Full name"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500"
            required
          />
        ) : null}
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-teal-500"
          required
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-slate-700 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="flex items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900 transition hover:border-slate-400 cursor-pointer"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.14 0-5.8-2.12-6.76-4.97H1.24v3.09A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.24 14.27A7.2 7.2 0 0 1 4.86 12c0-.79.14-1.56.38-2.27V6.64H1.24A12 12 0 0 0 0 12c0 1.94.46 3.77 1.24 5.36l4-3.09Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.16 15.24 0 12 0A12 12 0 0 0 1.24 6.64l4 3.09c.96-2.85 3.62-4.96 6.76-4.96Z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
