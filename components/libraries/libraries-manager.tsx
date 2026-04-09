"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Sparkles } from "lucide-react";
import type { Library } from "@prisma/client";
import { useRouter } from "next/navigation";
import { LibraryCard } from "@/components/libraries/library-card";
import { LibraryFormSheet } from "@/components/libraries/library-form-sheet";

type LibrariesManagerProps = {
  libraries: Library[];
};

export function LibrariesManager({ libraries }: LibrariesManagerProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | undefined>(undefined);
  const [sheetKey, setSheetKey] = useState(0);
  const hasActiveScan = libraries.some((library) => library.scanStatus === "RUNNING");

  useEffect(() => {
    if (!hasActiveScan) {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasActiveScan, router]);

  const openCreate = () => {
    setSelectedLibrary(undefined);
    setSheetKey((current) => current + 1);
    setSheetOpen(true);
  };

  const openEdit = (library: Library) => {
    setSelectedLibrary(library);
    setSheetKey((current) => current + 1);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSelectedLibrary(undefined);
    setSheetOpen(false);
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
            <LibraryCard key={library.id} library={library} onEdit={openEdit} />
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
