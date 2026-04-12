"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, CalendarDays, Folder, HardDrive, ScanSearch, Trash2 } from "lucide-react";
import { deleteLibraryAction, toggleLibraryEnabledAction } from "@/app/libraries/actions";
import { ScanLibraryForm } from "@/components/libraries/scan-library-form";
import type { LibraryRecord } from "@/lib/data/libraries";

type LibraryCardProps = {
  library: LibraryRecord;
  onEdit: (library: LibraryRecord) => void;
};

export function LibraryCard({ library, onEdit }: LibraryCardProps) {
  const scanDisabled =
    !library.storageAvailable ||
    !library.enabled ||
    library.scanStatus === "RUNNING" ||
    library.scanStatus === "QUEUED";

  return (
    <article className="rounded-[24px] border border-white/10 bg-surface/80 p-4 shadow-panel sm:rounded-[28px] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{library.name}</h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                library.enabled
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border-slate-400/20 bg-slate-400/10 text-slate-300"
              }`}
            >
              {library.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="mt-4 flex items-start gap-3 text-slate-400">
            <Folder className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="break-all text-sm leading-6">{library.path}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <ScanLibraryForm
            libraryId={library.id}
            disabled={scanDisabled}
            scanStatus={library.scanStatus}
          />
          <button
            type="button"
            onClick={() => onEdit(library)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
          >
            Edit
          </button>
          <DeleteButton id={library.id} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={ScanSearch}
          label="Last scanned"
          value={library.lastScannedAt ? formatDateTime(library.lastScannedAt) : "Never"}
        />
        <Stat
          icon={HardDrive}
          label="Files in library"
          value={formatCount(library.mediaFileCount)}
        />
        <Stat icon={CalendarDays} label="Created" value={formatDate(library.createdAt)} />
        <ToggleForm id={library.id} enabled={library.enabled} />
      </div>

      {library.scanStatus === "RUNNING" ? (
        <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Scanning</p>
          <p className="mt-2 text-sm text-sky-50">
            {library.scanFilesScanned} files checked, {library.scanVideosFound} videos indexed
          </p>
          {library.scanCurrentPath ? (
            <p className="mt-2 break-all text-xs leading-5 text-sky-200">{library.scanCurrentPath}</p>
          ) : null}
        </div>
      ) : null}

      {library.scanStatus === "QUEUED" ? (
        <div className="mt-4 rounded-2xl border border-indigo-400/20 bg-indigo-400/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">Queued</p>
          <p className="mt-2 text-sm text-indigo-50">
            Waiting for the current scan to finish. This library will start automatically.
          </p>
          {library.scanQueuedAt ? (
            <p className="mt-2 text-xs leading-5 text-indigo-200">
              Added to queue {formatDateTime(library.scanQueuedAt)}
            </p>
          ) : null}
        </div>
      ) : null}

      {library.scanStatus === "FAILED" && library.scanError ? (
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
          {library.scanError}
        </div>
      ) : null}

      {library.scanStatus === "IDLE" &&
      !library.scanError &&
      Boolean(library.lastScannedAt) &&
      library.scanFilesScanned === 0 &&
      library.scanVideosFound === 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
          No videos were found in this folder on the last scan.
        </div>
      ) : null}

      {!library.storageAvailable ? (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Storage unavailable</p>
              <p className="mt-1 text-amber-200/90">
                {library.storageMessage || "This library path cannot be reached right now."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function ToggleForm({ id, enabled }: { id: string; enabled: boolean }) {
  const nextEnabled = !enabled;

  return (
    <form
      action={toggleLibraryEnabledAction}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="enabled" value={String(nextEnabled)} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Availability</p>
          <p className="mt-3 text-sm font-medium text-white">
            {enabled ? "Used by future scans" : "Kept but inactive"}
          </p>
        </div>
        <ActionSubmitButton label={enabled ? "Disable" : "Enable"} />
      </div>
    </form>
  );
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteLibraryAction}>
      <input type="hidden" name="id" value={id} />
      <ActionSubmitButton
        label="Delete"
        icon={<Trash2 className="h-4 w-4" />}
        danger
      />
    </form>
  );
}

function ActionSubmitButton({
  label,
  icon,
  danger,
}: {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        danger
          ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
          : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {icon}
      {pending ? "Working..." : label}
    </button>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}
