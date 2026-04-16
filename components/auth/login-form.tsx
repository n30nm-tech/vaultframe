type LoginFormProps = {
  returnTo: string;
  error?: string;
};

export function LoginForm({ returnTo, error }: LoginFormProps) {
  return (
    <section className="w-full rounded-[32px] border border-white/10 bg-surface/90 p-6 shadow-panel sm:p-8">
      <p className="text-sm uppercase tracking-[0.24em] text-accent">Protected Access</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Unlock VaultFrame</h1>
      <p className="mt-3 text-sm leading-7 text-slate-400">
        Enter the shared app password to access your media library. If you ever forget the saved password,
        you can use the recovery password from the server environment and change it again in Settings.
      </p>

      <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
        <input type="hidden" name="returnTo" value={returnTo} />

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Password
          </span>
          <input
            type="password"
            name="password"
            autoFocus
            required
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40"
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
        >
          Unlock
        </button>
      </form>
    </section>
  );
}
