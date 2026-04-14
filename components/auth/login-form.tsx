"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { loginAction, type LoginActionState } from "@/app/login/actions";

type LoginFormProps = {
  nextPath: string;
  authConfigured: boolean;
};

const initialState: LoginActionState = {
  success: false,
};

export function LoginForm({ nextPath, authConfigured }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <section className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-surface/90 p-6 shadow-panel sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Lock className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Protected access</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Sign in to VaultFrame</h2>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-400">
        Enter the shared app password to open the dashboard, libraries, media browser, and stream routes.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={nextPath} />

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            disabled={!authConfigured || pending}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        {!authConfigured ? (
          <p className="text-sm text-amber-300">
            Set `APP_PASSWORD` and `APP_SESSION_SECRET` in the environment to enable login.
          </p>
        ) : null}

        {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}

        <button
          type="submit"
          disabled={!authConfigured || pending}
          className="w-full rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
