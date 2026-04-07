"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CalendarDays, Folder, ScanSearch, Trash2 } from "lucide-react";
import type { Library } from "@prisma/client";
import { deleteLibraryAction, toggleLibraryEnabledAction } from "@/app/libraries/actions";
import { ScanLibraryForm } from "@/components/libraries/scan-library-form";

type LibraryCardProps = {
  library: Library;
  onEdit: (library: Library) => void;
};

export function LibraryCard({ library, onEdit }: LibraryCardProps) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-surface/80 p-6 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold tracking-tight text-white">{library.name}</h3>
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

        <div className="flex flex-wrap items-center gap-2">
          <ScanLibraryForm libraryId={library.id} />
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

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Stat
          icon={ScanSearch}
          label="Last scanned"
          value={library.lastScannedAt ? formatDateTime(library.lastScannedAt) : "Never"}
        />
        <Stat icon={CalendarDays} label="Created" value={formatDate(library.createdAt)} />
        <ToggleForm id={library.id} enabled={library.enabled} />
      </div>
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
