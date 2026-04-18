"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightLeft, Images, LoaderCircle, Square, Trash2, Video } from "lucide-react";
import type { ModelRecord } from "@/lib/data/models";

type ModelCardProps = {
  model: ModelRecord;
  onDelete: (id: string) => void;
  onMerge: (id: string) => void;
  onCancelImport: (id: string) => void;
  deletePending?: boolean;
  mergePending?: boolean;
  cancelPending?: boolean;
};

export function ModelCard({
  model,
  onDelete,
  onMerge,
  onCancelImport,
  deletePending = false,
  mergePending = false,
  cancelPending = false,
}: ModelCardProps) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-white/10 bg-surface/80 shadow-panel">
      <Link href={`/models/${model.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#0b1016]">
          {model.coverUrl ? (
            <Image
              src={model.coverUrl}
              alt={model.name}
              fill
              className="object-cover transition duration-300 hover:scale-[1.02]"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              <Images className="h-10 w-10" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-white">{model.name}</h3>
                <p className="truncate text-sm text-slate-300">{model.assetCount} assets</p>
              </div>
              {model.coverType ? (
                <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  {model.coverType}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Images className="h-4 w-4" />
              <span>Photos</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-white">{model.photoCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Video className="h-4 w-4" />
              <span>Videos</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-white">{model.videoCount}</p>
          </div>
        </div>

        {model.importStatus === "RUNNING" || model.importStatus === "QUEUED" || model.importStatus === "CANCELLING" ? (
          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-4 text-sm text-sky-100">
            <div className="flex items-center gap-2 font-medium">
              <LoaderCircle className="h-4 w-4" />
              <span>
                {model.importStatus === "RUNNING"
                  ? "Importing now"
                  : model.importStatus === "CANCELLING"
                    ? "Stopping import"
                    : "Queued to import"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs uppercase tracking-[0.16em] text-sky-100/80">
              <div>
                <p>Total</p>
                <p className="mt-1 text-base font-semibold text-white">{model.importTotalFiles}</p>
              </div>
              <div>
                <p>Checked</p>
                <p className="mt-1 text-base font-semibold text-white">{model.importFilesScanned}</p>
              </div>
              <div>
                <p>Left</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {Math.max(model.importTotalFiles - model.importFilesScanned, 0)}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.16em] text-sky-100/80">
              <div>
                <p>Photos</p>
                <p className="mt-1 text-base font-semibold text-white">{model.importPhotosFound}</p>
              </div>
              <div>
                <p>Videos</p>
                <p className="mt-1 text-base font-semibold text-white">{model.importVideosFound}</p>
              </div>
            </div>
            {model.importCurrentPath ? (
              <p className="mt-3 break-all text-xs text-sky-50/90">{model.importCurrentPath}</p>
            ) : null}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onCancelImport(model.id)}
                disabled={cancelPending || model.importStatus === "CANCELLING"}
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200/20 bg-black/20 px-4 py-2.5 text-sm font-medium text-sky-50 transition hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Square className="h-4 w-4" />
                {model.importStatus === "CANCELLING"
                  ? "Stopping..."
                  : model.importStatus === "QUEUED"
                    ? "Remove from queue"
                    : "Stop import"}
              </button>
            </div>
          </div>
        ) : null}

        {model.importError && model.importStatus !== "RUNNING" && model.importStatus !== "QUEUED" && model.importStatus !== "CANCELLING" ? (
          <div
            className={`rounded-2xl px-4 py-4 text-sm ${
              model.importStatus === "FAILED"
                ? "border border-rose-500/20 bg-rose-500/10 text-rose-100"
                : "border border-amber-400/20 bg-amber-400/10 text-amber-50"
            }`}
          >
            {model.importError}
          </div>
        ) : null}

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Folder</p>
          <p className="break-all text-sm text-slate-300">{model.path}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/models/${model.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.04] hover:text-white"
          >
            Open gallery
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onMerge(model.id)}
              disabled={mergePending}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Merge
            </button>
            <button
              type="button"
              onClick={() => onDelete(model.id)}
              disabled={deletePending}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
