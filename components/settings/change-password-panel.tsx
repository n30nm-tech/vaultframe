"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import {
  changePasswordAction,
  type ChangePasswordActionState,
} from "@/app/settings/auth-actions";

const initialState: ChangePasswordActionState = {
  success: false,
};

export function ChangePasswordPanel() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <section className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <KeyRound className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white">Change app password</h3>
          <p className="text-sm text-slate-400">
            Update the shared sign-in password without editing the environment file by hand.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-6 grid gap-4 lg:grid-cols-3">
        <Field label="Current password">
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
          />
        </Field>

        <Field label="New password">
          <input
            type="password"
            name="nextPassword"
            autoComplete="new-password"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
          />
        </Field>

        <Field label="Confirm new password">
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
          />
        </Field>

        <div className="lg:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {state.error ? <p className="text-rose-300">{state.error}</p> : null}
            {state.message ? <p className="text-emerald-300">{state.message}</p> : null}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Updating..." : "Change password"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}
