import Link from "next/link";
import type { ReactNode } from "react";
import { Clock3, FolderTree, HardDrive, PlaySquare, ScanSearch } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { getDashboardData } from "@/lib/data/dashboard";
import { requirePageAuth } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePageAuth("/");
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Operational overview"
        description="Watch scan activity, spot storage issues, and jump straight into the libraries and media that need attention."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-[28px] border border-white/10 bg-surface/80 p-5 shadow-panel"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{stat.title}</p>
            </div>
            <p className="mt-6 text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-400">{stat.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Scan activity"
          action={
            <Link
              href="/libraries"
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
            >
              Open Libraries
            </Link>
          }
        >
          {data.runningLibraries.length === 0 && data.queuedLibraries.length === 0 ? (
            <EmptyLine
              icon={<ScanSearch className="h-4 w-4" />}
              text="No active scans right now. Queue libraries from the Libraries page."
            />
          ) : (
            <div className="space-y-3">
              {data.runningLibraries.map((library) => (
                <StatusRow
                  key={library.id}
                  title={library.name}
                  badge="Scanning"
                  tone="sky"
                  body={`${library.scanFilesScanned} processed, ${library.scanVideosFound} videos found`}
                  meta={library.scanCurrentPath || library.path}
                />
              ))}
              {data.queuedLibraries.map((library) => (
                <StatusRow
                  key={library.id}
                  title={library.name}
                  badge="Queued"
                  tone="indigo"
                  body="Waiting for the current scan to finish."
                  meta={library.path}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Quick actions">
          <div className="grid gap-3">
            <QuickLink
              href="/libraries"
              icon={<FolderTree className="h-4 w-4" />}
              title="Manage libraries"
              body="Add folders, queue scans, and watch scan progress."
            />
            <QuickLink
              href="/media"
              icon={<PlaySquare className="h-4 w-4" />}
              title="Browse media"
              body="Search, sort, and jump back into recent media."
            />
            <QuickLink
              href="/settings"
              icon={<HardDrive className="h-4 w-4" />}
              title="Check environment"
              body="Review deployment notes and mounted storage paths."
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Attention needed">
          {data.offlineLibraries.length === 0 &&
          data.failedLibraries.length === 0 ? (
            <EmptyLine
              icon={<Clock3 className="h-4 w-4" />}
              text="No storage or scan failures detected right now."
            />
          ) : (
            <div className="space-y-3">
              {data.offlineLibraries.map((library) => (
                <StatusRow
                  key={library.id}
                  title={library.name}
                  badge="Offline"
                  tone="rose"
                  body={library.storageMessage || "The library folder is currently unavailable."}
                  meta={library.path}
                />
              ))}
              {data.failedLibraries.map((library) => (
                <StatusRow
                  key={library.id}
                  title={library.name}
                  badge="Failed"
                  tone="amber"
                  body={library.scanError || "The last scan did not complete."}
                  meta={library.path}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recently scanned libraries">
          {data.recentlyScannedLibraries.length === 0 ? (
            <EmptyLine
              icon={<FolderTree className="h-4 w-4" />}
              text="Run your first library scan to build a recent activity history."
            />
          ) : (
            <div className="space-y-3">
              {data.recentlyScannedLibraries.map((library) => (
                <div
                  key={library.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{library.name}</p>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {formatDateTime(library.lastScannedAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {library.scanVideosFound} videos found in the latest scan
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <Panel
        title="Recent media activity"
        action={
          <Link
            href="/media"
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
          >
            Open Media
          </Link>
        }
      >
        {data.recentMediaItems.length === 0 ? (
          <EmptyLine
            icon={<PlaySquare className="h-4 w-4" />}
            text="No media indexed yet. Scan a library to populate the browser."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.recentMediaItems.map((mediaItem) => (
              <Link
                key={mediaItem.id}
                href={`/media/${mediaItem.id}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {mediaItem.title?.trim() || mediaItem.fileName}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{mediaItem.library.name}</p>
                  </div>
                  {mediaItem.missing ? (
                    <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                      Missing
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Updated {formatDateTime(mediaItem.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-surface/80 p-5 shadow-panel sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusRow({
  title,
  badge,
  tone,
  body,
  meta,
}: {
  title: string;
  badge: string;
  tone: "sky" | "indigo" | "rose" | "amber";
  body: string;
  meta: string;
}) {
  const toneClass =
    tone === "sky"
      ? "border-sky-400/20 bg-sky-400/10 text-sky-100"
      : tone === "indigo"
        ? "border-indigo-400/20 bg-indigo-400/10 text-indigo-100"
        : tone === "rose"
          ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
          : "border-amber-400/20 bg-amber-400/10 text-amber-100";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium text-white">{title}</p>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}>
          {badge}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{body}</p>
      <p className="mt-2 break-all text-xs text-slate-500">{meta}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-2 text-white">
        {icon}
        <p className="font-medium">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
    </Link>
  );
}

function EmptyLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-slate-400">
      <span className="text-slate-500">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
