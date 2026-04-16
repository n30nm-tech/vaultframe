import type { ReactNode } from "react";

type AuthSettingsPanelProps = {
  overview: {
    enabled: boolean;
    hasSavedPassword: boolean;
    recoveryPasswordSet: boolean;
    passwordFilePath: string;
  };
  status?: string;
};

export function AuthSettingsPanel({ overview, status }: AuthSettingsPanelProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">App Access</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Shared password protection</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Use one shared password to keep the app out of casual view. A recovery password from the
            server environment can still unlock the app if the saved password is forgotten, so you
            are not locked out.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
          {overview.enabled ? "Protection available" : "Protection not configured yet"}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <InfoCard label="Saved app password" value={overview.hasSavedPassword ? "Configured" : "Not saved yet"} />
        <InfoCard label="Recovery password" value={overview.recoveryPasswordSet ? "Configured in .env" : "Not set"} />
        <InfoCard label="Password file" value={overview.passwordFilePath} subtle />
      </div>

      {status === "changed" ? (
        <Banner tone="success" text="Password updated. You can keep using the app with the new password immediately." />
      ) : null}
      {status === "invalid-current" ? (
        <Banner tone="error" text="Current password was not accepted." />
      ) : null}
      {status === "mismatch" ? (
        <Banner tone="error" text="New password and confirmation did not match." />
      ) : null}
      {status === "empty-new" ? (
        <Banner tone="error" text="New password cannot be empty." />
      ) : null}

      <form action="/api/auth/change-password" method="post" className="mt-6 grid gap-4 lg:grid-cols-3">
        <Field label={overview.enabled ? "Current password" : "Current password (not needed yet)"}>
          <input
            type="password"
            name="currentPassword"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
          />
        </Field>
        <Field label="New password">
          <input
            type="password"
            name="newPassword"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            name="confirmPassword"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
          />
        </Field>

        <div className="lg:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            {overview.enabled
              ? "Recovery path: keep `APP_PASSWORD` in `/opt/vaultframe/.env`. If the saved password is forgotten,"
              : "You can enable protection here with a new shared password. For a safer recovery path, keep `APP_PASSWORD` in `/opt/vaultframe/.env` too."}
            {overview.enabled ? " use that recovery password to log in and set a new one here." : ""}
          </p>
          <button
            type="submit"
            className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
          >
            Change password
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoCard({
  label,
  value,
  subtle = false,
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm ${subtle ? "break-all text-slate-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function Banner({
  tone,
  text,
}: {
  tone: "success" | "error";
  text: string;
}) {
  return (
    <div
      className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
        tone === "success"
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border border-rose-500/30 bg-rose-500/10 text-rose-200"
      }`}
    >
      {text}
    </div>
  );
}
