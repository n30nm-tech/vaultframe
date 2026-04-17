"use client";

import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModelCard } from "@/components/models/model-card";
import { ModelFormSheet } from "@/components/models/model-form-sheet";
import { PlaceholderCard } from "@/components/ui/placeholder-card";
import type { ModelRecord } from "@/lib/data/models";

type ModelsManagerProps = {
  models: ModelRecord[];
};

export function ModelsManager({ models }: ModelsManagerProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasActiveImport = models.some(
    (model) => model.importStatus === "RUNNING" || model.importStatus === "QUEUED",
  );
  const runningModel = models.find((model) => model.importStatus === "RUNNING");
  const queuedCount = models.filter((model) => model.importStatus === "QUEUED").length;

  useEffect(() => {
    if (!hasActiveImport) {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasActiveImport, router]);

  const handleDelete = async (id: string) => {
    if (deletePending) {
      return;
    }

    if (!window.confirm("Delete this model gallery?")) {
      return;
    }

    setDeletePending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/models/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Delete failed.");
      }

      setMessage("Model deleted.");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <>
      <section className="flex flex-col gap-5 rounded-[28px] border border-white/10 bg-surface/80 p-5 shadow-panel sm:rounded-[32px] sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Separate gallery area</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Folder-driven model collections
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Add a model by choosing one filesystem folder. Everything inside that folder tree is
            ingested into a dedicated photo and video gallery without changing the current
            Libraries or Media sections.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong sm:w-auto"
        >
          <FolderPlus className="h-4 w-4" />
          Add Model
        </button>
      </section>

      {message ? (
        <section className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </section>
      ) : null}

      {error ? (
        <section className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </section>
      ) : null}

      {hasActiveImport ? (
        <section className="mt-4 rounded-[24px] border border-sky-400/20 bg-sky-400/10 px-5 py-4 text-sm text-sky-50">
          <div className="space-y-1">
            <p className="font-medium">
              {runningModel
                ? `Importing ${runningModel.name} right now`
                : "Model import queue is active"}
            </p>
            <p className="text-sky-100/90">
              {runningModel
                ? `${runningModel.importFilesScanned} of ${runningModel.importTotalFiles} files checked. ${runningModel.importPhotosFound} photos and ${runningModel.importVideosFound} videos imported so far.`
                : "The next model import will begin automatically."}
              {queuedCount > 0 ? ` ${queuedCount} more model ${queuedCount === 1 ? "is" : "are"} queued behind it.` : ""}
            </p>
          </div>
        </section>
      ) : null}

      {models.length === 0 ? (
        <div className="mt-6">
          <PlaceholderCard
            title="No model galleries yet"
            body="Create your first model by picking a folder. We’ll keep it separate from the main archive and turn it into a gallery-first space for photos and videos."
            meta="Models are separate from libraries and media scans"
          />
        </div>
      ) : (
        <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onDelete={handleDelete}
              deletePending={deletePending}
            />
          ))}
        </section>
      )}

      <ModelFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
