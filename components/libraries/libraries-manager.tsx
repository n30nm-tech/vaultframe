"use client";

import { useEffect, useRef, useState } from "react";
import { FolderPlus, LoaderCircle, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteLibrariesAction } from "@/app/libraries/actions";
import { LibraryCard } from "@/components/libraries/library-card";
import { LibraryFormSheet } from "@/components/libraries/library-form-sheet";
import type { LibraryRecord } from "@/lib/data/libraries";

type LibrariesManagerProps = {
  libraries: LibraryRecord[];
};

export function LibrariesManager({ libraries }: LibrariesManagerProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<LibraryRecord | undefined>(undefined);
  const [sheetKey, setSheetKey] = useState(0);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const pendingScrollRestoreRef = useRef<number | null>(null);
  const hasActiveScan = libraries.some(
    (library) => library.scanStatus === "RUNNING" || library.scanStatus === "QUEUED",
  );
  const runningLibrary = libraries.find((library) => library.scanStatus === "RUNNING");
  const queuedCount = libraries.filter((library) => library.scanStatus === "QUEUED").length;
  const needsScanCount = libraries.filter(
    (library) =>
      library.enabled &&
      library.scanStatus === "IDLE" &&
      library.mediaFileCount === 0 &&
      !library.lastScannedAt,
  ).length;

  useEffect(() => {
    if (!hasActiveScan) {
      return;
    }

    const interval = window.setInterval(() => {
      pendingScrollRestoreRef.current = window.scrollY;
      router.refresh();
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasActiveScan, router]);

  useEffect(() => {
    if (pendingScrollRestoreRef.current === null) {
      return;
    }

    const scrollTop = pendingScrollRestoreRef.current;
    pendingScrollRestoreRef.current = null;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollTop, behavior: "auto" });
      });
    });
  }, [libraries]);

  useEffect(() => {
    setSelectedLibraryIds((currentIds) =>
      currentIds.filter((id) => libraries.some((library) => library.id === id)),
    );
  }, [libraries]);

  const openCreate = () => {
    setSelectedLibrary(undefined);
    setSheetKey((current) => current + 1);
    setSheetOpen(true);
  };

  const openEdit = (library: LibraryRecord) => {
    setSelectedLibrary(library);
    setSheetKey((current) => current + 1);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSelectedLibrary(undefined);
    setSheetOpen(false);
  };

  const allVisibleSelected =
    libraries.length > 0 && selectedLibraryIds.length === libraries.length;

  const toggleLibrarySelected = (libraryId: string) => {
    setSelectedLibraryIds((currentIds) =>
      currentIds.includes(libraryId)
        ? currentIds.filter((id) => id !== libraryId)
        : [...currentIds, libraryId],
    );
  };

  const toggleAllVisible = () => {
    setSelectedLibraryIds(allVisibleSelected ? [] : libraries.map((library) => library.id));
  };

  return (
    <>
      <section className="flex flex-col gap-5 rounded-[28px] border border-white/10 bg-surface/80 p-5 shadow-panel sm:rounded-[32px] sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Saved libraries</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Persistent media roots
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Add and maintain the root folders your self-hosted library will use. Changes persist in PostgreSQL across refreshes and container restarts.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong sm:w-auto"
        >
          <FolderPlus className="h-4 w-4" />
          Add Library
        </button>
      </section>

      {libraries.length > 0 ? (
        <section className="mt-6 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-surface/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleAllVisible}
              className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.04] hover:text-white"
            >
              {allVisibleSelected ? "Clear selection" : "Select all visible"}
            </button>
            <p className="text-sm text-slate-400">
              {selectedLibraryIds.length} selected
            </p>
          </div>

          <form action={deleteLibrariesAction}>
            {selectedLibraryIds.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <BulkDeleteButton disabled={selectedLibraryIds.length === 0} />
          </form>
        </section>
      ) : null}

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <StatusCard
          label="Needs first scan"
          value={String(needsScanCount)}
          detail={
            needsScanCount > 0
              ? "Enabled libraries with no indexed files yet."
              : "All enabled libraries have been scanned at least once."
          }
        />
        <StatusCard
          label="Scanning now"
          value={runningLibrary ? runningLibrary.name : "Idle"}
          detail={
            runningLibrary
              ? `${runningLibrary.scanFilesScanned} checked, ${runningLibrary.scanVideosFound} indexed.`
              : "No library is currently scanning."
          }
          accent={Boolean(runningLibrary)}
        />
        <StatusCard
          label="Queued behind"
          value={String(queuedCount)}
          detail={
            queuedCount > 0
              ? "These libraries will start automatically in the background."
              : "No additional libraries are waiting."
          }
        />
      </section>

      {(runningLibrary || needsScanCount > 0 || queuedCount > 0) ? (
        <section className="mt-6 rounded-[28px] border border-sky-400/20 bg-sky-400/10 px-5 py-4 text-sm text-sky-50 sm:rounded-[32px] sm:px-6">
          <div className="flex items-start gap-3">
            <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Background scanning is active.</p>
              <p className="text-sky-100/90">
                The app will keep working through enabled libraries that have never been scanned, one at a time. The page now preserves your place while it refreshes.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {libraries.length === 0 ? (
        <section className="mt-6 rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] px-5 py-12 text-center sm:rounded-[32px] sm:px-8 sm:py-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/10 text-accent">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="mt-6 text-2xl font-semibold tracking-tight text-white">
            No libraries saved yet
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
            Start by adding your first media root folder with the built-in server-side folder chooser.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] sm:w-auto"
          >
            <FolderPlus className="h-4 w-4" />
            Add your first library
          </button>
        </section>
      ) : (
        <section className="mt-6 grid gap-4">
          {libraries.map((library) => (
            <LibraryCard
              key={library.id}
              library={library}
              onEdit={openEdit}
              selected={selectedLibraryIds.includes(library.id)}
              onToggleSelect={toggleLibrarySelected}
            />
          ))}
        </section>
      )}

      <LibraryFormSheet
        key={`${selectedLibrary ? selectedLibrary.id : "new"}-${sheetKey}`}
        library={selectedLibrary}
        open={sheetOpen}
        onClose={closeSheet}
      />
    </>
  );
}

function BulkDeleteButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      Delete selected
    </button>
  );
}

function StatusCard({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 shadow-panel ${
        accent
          ? "border-sky-400/20 bg-sky-400/10"
          : "border-white/10 bg-surface/60"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}
