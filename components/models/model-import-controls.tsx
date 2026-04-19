"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, RefreshCw, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ModelGalleryRecord } from "@/lib/data/models";

type ModelImportControlsProps = {
  model: ModelGalleryRecord;
};

export function ModelImportControls({ model }: ModelImportControlsProps) {
  const router = useRouter();
  const [queuePending, setQueuePending] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActiveImport =
    model.importStatus === "RUNNING" ||
    model.importStatus === "QUEUED" ||
    model.importStatus === "CANCELLING";
  const isDiscovering =
    model.importStatus === "RUNNING" &&
    model.importTotalFiles === 0 &&
    model.importFilesScanned === 0;

  useEffect(() => {
    if (!isActiveImport) {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [isActiveImport, router]);

  const statusText = useMemo(() => {
    if (model.importStatus === "CANCELLING") {
      return "Stopping this model import safely.";
    }

    if (model.importStatus === "QUEUED") {
      return "Queued and waiting to start.";
    }

    if (isDiscovering) {
      return "Discovering supported files so the totals are accurate before import begins.";
    }

    if (model.importStatus === "RUNNING") {
      return `${model.importFilesScanned} of ${model.importTotalFiles} files checked. ${model.importPhotosFound} photos and ${model.importVideosFound} videos imported so far.`;
    }

    if (model.importStatus === "FAILED") {
      return model.importError || "The last import failed.";
    }

    if (model.importError) {
      return model.importError;
    }

    if (model.lastImportedAt) {
      return `Last imported on ${new Date(model.lastImportedAt).toLocaleString()}.`;
    }

    return "This model has not been imported yet.";
  }, [isDiscovering, model]);

  const handleRerunImport = async () => {
    if (queuePending) {
      return;
    }

    setQueuePending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/models/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ modelId: model.id }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to queue model import.");
      }

      setMessage("Model import queued.");
      router.refresh();
    } catch (queueError) {
      setError(queueError instanceof Error ? queueError.message : "Unable to queue model import.");
    } finally {
      setQueuePending(false);
    }
  };

  const handleCancelImport = async () => {
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
        body: JSON.stringify({ modelId: model.id }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        status?: "cancelled-queued" | "cancelling";
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to stop model import.");
      }

      setMessage(
        payload.status === "cancelled-queued"
          ? "Removed this model from the import queue."
          : "Stopping model import now.",
      );
      router.refresh();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to stop model import.");
    } finally {
      setCancelPending(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-white/10 bg-surface/80 p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Model Import</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
            Re-run this model import
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">{statusText}</p>
          {model.importCurrentPath ? (
            <p className="mt-3 break-all text-xs text-slate-500">{model.importCurrentPath}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {isActiveImport ? (
            <button
              type="button"
              onClick={() => void handleCancelImport()}
              disabled={cancelPending || model.importStatus === "CANCELLING"}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-200/20 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelPending || model.importStatus === "CANCELLING" ? (
                <LoaderCircle className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {model.importStatus === "CANCELLING" ? "Stopping..." : "Stop import"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void handleRerunImport()}
            disabled={queuePending || isActiveImport}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {queuePending ? <LoaderCircle className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            {model.lastImportedAt ? "Re-run import" : "Run import"}
          </button>
        </div>
      </div>

      {(model.importStatus === "RUNNING" || model.importStatus === "QUEUED" || model.importStatus === "CANCELLING") && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:max-w-xl">
          <ProgressStat label="Total" value={String(model.importTotalFiles)} />
          <ProgressStat label="Checked" value={String(model.importFilesScanned)} />
          <ProgressStat label="Left" value={String(Math.max(model.importTotalFiles - model.importFilesScanned, 0))} />
        </div>
      )}

      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
    </section>
  );
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
