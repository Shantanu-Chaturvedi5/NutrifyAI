"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { loginAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="rounded-[2rem] border border-glass-border bg-glass-card p-6 shadow-[0_24px_70px_rgba(28,34,28,0.10)] backdrop-blur-xl sm:p-9">
      <div className="mb-7">
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-soft text-sage">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <p className="font-data text-[10px] font-semibold uppercase tracking-[0.18em] text-sage">Welcome back</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-graphite">
          Log in to your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-graphite-70">
          Pick up where you left off with your health insights.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-graphite">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-hairline bg-card/80 px-4 py-3 text-sm text-graphite placeholder:text-graphite-45 outline-none transition focus:border-sage focus:ring-4 focus:ring-sage-soft"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-graphite">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="w-full rounded-xl border border-hairline bg-card/80 px-4 py-3 text-sm text-graphite placeholder:text-graphite-45 outline-none transition focus:border-sage focus:ring-4 focus:ring-sage-soft"
          />
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl border border-critical/35 bg-critical-soft px-4 py-3 text-sm text-critical">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-garnet px-4 py-3 font-semibold text-white shadow-[0_10px_22px_rgba(217,31,66,0.18)] transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Logging in…" : <>Log in <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite-70">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-garnet underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
