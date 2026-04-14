import type { getSettingsOverview } from "@/lib/data/settings";

type SystemStatusPanelProps = {
  overview: Awaited<ReturnType<typeof getSettingsOverview>>;
};

export function SystemStatusPanel({ overview }: SystemStatusPanelProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.24em] text-accent">System status</p>
        <h3 className="text-2xl font-semibold tracking-tight text-white">Environment overview</h3>
        <p className="text-sm leading-7 text-slate-400">
          Check the app version, database connectivity, media roots, and FFmpeg tooling from one place.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Version" value={overview.appVersion} tone="neutral" />
        <Stat label="Database" value={overview.database.message} tone={overview.database.healthy ? "good" : "bad"} />
        <Stat label="FFmpeg" value={overview.ffmpeg.message} tone={overview.ffmpeg.available ? "good" : "bad"} />
        <Stat label="FFprobe" value={overview.ffprobe.message} tone={overview.ffprobe.available ? "good" : "bad"} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Runtime</p>
        <p className="mt-3 text-sm text-white">NODE_ENV: {overview.nodeEnv}</p>
        <p className="mt-2 break-all text-sm text-slate-300">Media data path: {overview.mediaDataPath}</p>
      </div>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Allowed media roots</p>
        <div className="mt-3 space-y-3">
          {overview.allowedRoots.length === 0 ? (
            <p className="text-sm text-slate-400">No allowed media roots are configured.</p>
          ) : (
            overview.allowedRoots.map((root) => (
              <div
                key={root.path}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      root.available
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                        : "border-rose-500/20 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    {root.available ? "Available" : "Unavailable"}
                  </span>
                  <p className="break-all text-sm text-white">{root.path}</p>
                </div>
                {!root.available && root.message ? (
                  <p className="mt-2 text-sm text-rose-200">{root.message}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-200"
      : tone === "bad"
        ? "text-rose-200"
        : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-3 text-sm font-medium ${toneClass}`}>{value}</p>
    </div>
  );
}
