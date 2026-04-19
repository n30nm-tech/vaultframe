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
  const [cancelPending, setCancelPending] = useState(false);
  const [mergePending, setMergePending] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "importing" | "idle" | "failed">("all");
  const [sort, setSort] = useState<"updated-desc" | "name-asc" | "assets-desc">("updated-desc");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasActiveImport = models.some(
    (model) =>
      model.importStatus === "RUNNING" ||
      model.importStatus === "QUEUED" ||
      model.importStatus === "CANCELLING",
  );
  const runningModel = models.find(
    (model) => model.importStatus === "RUNNING" || model.importStatus === "CANCELLING",
  );
  const runningModelIsDiscovering =
    runningModel?.importStatus === "RUNNING" &&
    runningModel.importTotalFiles === 0 &&
    runningModel.importFilesScanned === 0;
  const queuedCount = models.filter((model) => model.importStatus === "QUEUED").length;
  const failedCount = models.filter((model) => model.importStatus === "FAILED").length;

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

  useEffect(() => {
    if (!mergeSourceId) {
      setMergeTargetId("");
    }
  }, [mergeSourceId]);

  const visibleModels = models
    .filter((model) => {
      const searchValue = search.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        model.name.toLowerCase().includes(searchValue) ||
        model.path.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "importing"
            ? model.importStatus === "RUNNING" || model.importStatus === "QUEUED" || model.importStatus === "CANCELLING"
            : statusFilter === "failed"
              ? model.importStatus === "FAILED"
              : model.importStatus === "IDLE";

      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      switch (sort) {
        case "name-asc":
          return left.name.localeCompare(right.name);
        case "assets-desc":
          return right.assetCount - left.assetCount || left.name.localeCompare(right.name);
        case "updated-desc":
        default:
          return right.updatedAt.getTime() - left.updatedAt.getTime();
      }
    });

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

  const openMerge = (sourceId: string) => {
    setMergeSourceId(sourceId);
    setMergeTargetId("");
    setMessage(null);
    setError(null);
  };

  const handleMerge = async () => {
    if (!mergeSourceId || !mergeTargetId || mergePending) {
      return;
    }

    setMergePending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/models/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sourceModelId: mergeSourceId,
          targetModelId: mergeTargetId,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        sourceName?: string;
        targetName?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to merge models.");
      }

      setMessage(`Merged ${payload.sourceName ?? "model"} into ${payload.targetName ?? "target"}.`);
      setMergeSourceId(null);
      setMergeTargetId("");
      router.refresh();
    } catch (mergeError) {
      setError(mergeError instanceof Error ? mergeError.message : "Unable to merge models.");
    } finally {
      setMergePending(false);
    }
  };

  const handleCancelImport = async (id: string) => {
    if (cancelPending) {
      return;
    }

    setCancelPending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/models/import/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ modelId: id }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        name?: string;
        status?: "cancelled-queued" | "cancelling";
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to stop the import.");
      }

      setMessage(
        payload.status === "cancelled-queued"
          ? `${payload.name ?? "Model"} was removed from the import queue.`
          : `Stopping ${payload.name ?? "model"} now.`,
      );
      router.refresh();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to stop the import.");
    } finally {
      setCancelPending(false);
    }
  };

  const mergeSourceModel = mergeSourceId
    ? models.find((model) => model.id === mergeSourceId) ?? null
    : null;
  const mergeTargets = mergeSourceId
    ? models.filter((model) => model.id !== mergeSourceId)
    : [];

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
                ? runningModel.importStatus === "CANCELLING"
                  ? `Stopping ${runningModel.name}`
                  : runningModelIsDiscovering
                    ? `Discovering files for ${runningModel.name}`
                  : `Importing ${runningModel.name} right now`
                : "Model import queue is active"}
            </p>
            <p className="text-sky-100/90">
              {runningModel
                ? runningModel.importStatus === "CANCELLING"
                  ? "The current model import is being stopped safely."
                  : runningModelIsDiscovering
                    ? "We’re counting supported files first so the totals are accurate before import progress begins."
                  : `${runningModel.importFilesScanned} of ${runningModel.importTotalFiles} files checked. ${runningModel.importPhotosFound} photos and ${runningModel.importVideosFound} videos imported so far.`
                : "The next model import will begin automatically."}
              {queuedCount > 0 ? ` ${queuedCount} more model ${queuedCount === 1 ? "is" : "are"} queued behind it.` : ""}
            </p>
            <p className="text-sky-100/75">
              Imports keep running in the background, so you can stay on this page to watch
              progress or come back later and pick up where it left off.
            </p>
          </div>
        </section>
      ) : null}

      {!hasActiveImport && failedCount > 0 ? (
        <section className="mt-4 rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          <p className="font-medium">
            {failedCount} model import {failedCount === 1 ? "needs" : "need"} attention
          </p>
          <p className="mt-1 text-rose-100/85">
            Use the filter set to <span className="font-semibold text-white">Failed</span> to see
            the affected galleries and their error details.
          </p>
        </section>
      ) : null}

      <section className="mt-4 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-surface/70 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or folder path"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40 focus:bg-white/[0.05]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Filter</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-accent/40 focus:bg-white/[0.05]"
            >
              <option value="all">All models</option>
              <option value="importing">Importing / queued</option>
              <option value="idle">Idle</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-accent/40 focus:bg-white/[0.05]"
            >
              <option value="updated-desc">Recently updated</option>
              <option value="name-asc">Name</option>
              <option value="assets-desc">Most assets</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-slate-400">
          {visibleModels.length} visible model{visibleModels.length === 1 ? "" : "s"}
        </p>
      </section>

      {mergeSourceModel ? (
        <section className="mt-4 rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-100">Merge gallery</p>
              <p className="mt-1 text-sm text-amber-50/90">
                Merge <span className="font-semibold text-white">{mergeSourceModel.name}</span> into another model.
                All assets will move into the target gallery, then the source gallery will be removed.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_auto_auto]">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-amber-50/80">Target model</span>
                <select
                  value={mergeTargetId}
                  onChange={(event) => setMergeTargetId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition focus:border-accent/40"
                >
                  <option value="">Choose target</option>
                  {mergeTargets.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void handleMerge()}
                disabled={!mergeTargetId || mergePending}
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mergePending ? "Merging..." : "Merge"}
              </button>
              <button
                type="button"
                onClick={() => setMergeSourceId(null)}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </button>
            </div>
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
      ) : visibleModels.length === 0 ? (
        <div className="mt-6">
          <PlaceholderCard
            title="No models match these controls"
            body="Try clearing the search box, changing the status filter, or switching the sort. Your model galleries are still there; this view is just filtered down."
            meta="Search, sort, and filter only change the current view"
          />
        </div>
      ) : (
        <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onDelete={handleDelete}
              onMerge={openMerge}
              onCancelImport={handleCancelImport}
              deletePending={deletePending}
              mergePending={mergePending}
              cancelPending={cancelPending}
            />
          ))}
        </section>
      )}

      <ModelFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
