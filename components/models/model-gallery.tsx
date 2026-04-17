"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, LoaderCircle, PlayCircle, X } from "lucide-react";
import clsx from "clsx";
import { PlaceholderCard } from "@/components/ui/placeholder-card";
import type { ModelGalleryRecord } from "@/lib/data/models";
import { useRouter } from "next/navigation";

type ModelGalleryProps = {
  model: ModelGalleryRecord;
};

type FilterMode = "all" | "photo" | "video";
type ThumbnailSizeMode = "standard" | "compact";

export function ModelGallery({ model }: ModelGalleryProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSizeMode>("standard");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [coverSavingAssetId, setCoverSavingAssetId] = useState<string | null>(null);
  const [coverMessage, setCoverMessage] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const visibleAssets = useMemo(() => {
    return model.assets.filter((asset) => {
      if (filter === "all") {
        return true;
      }

      return asset.assetType === filter;
    });
  }, [filter, model.assets]);

  const selectedIndex = selectedAssetId
    ? visibleAssets.findIndex((asset) => asset.id === selectedAssetId)
    : -1;
  const selectedAsset = selectedIndex >= 0 ? visibleAssets[selectedIndex] : null;

  useEffect(() => {
    if (selectedAssetId && !visibleAssets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(null);
    }
  }, [selectedAssetId, visibleAssets]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedAsset) {
        return;
      }

      if (event.key === "Escape") {
        setSelectedAssetId(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedAssetId(visibleAssets[Math.max(selectedIndex - 1, 0)]?.id ?? selectedAsset.id);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedAssetId(
          visibleAssets[Math.min(selectedIndex + 1, visibleAssets.length - 1)]?.id ?? selectedAsset.id,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedAsset, selectedIndex, visibleAssets]);

  const setAsModelCover = async () => {
    if (!selectedAsset || coverSavingAssetId) {
      return;
    }

    setCoverSavingAssetId(selectedAsset.id);
    setCoverMessage(null);
    setCoverError(null);

    try {
      const formData = new FormData();
      formData.set("assetId", selectedAsset.id);
      formData.set("returnTo", `/models/${model.id}`);

      const response = await fetch(`/api/models/${model.id}/cover?format=json`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to update model cover.");
      }

      setCoverMessage("Model cover updated.");
      router.refresh();
    } catch (error) {
      setCoverError(error instanceof Error ? error.message : "Unable to update model cover.");
    } finally {
      setCoverSavingAssetId(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-surface/80 p-5 shadow-panel">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Gallery view</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
            Photos and videos together
          </h3>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "photo", "video"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={clsx(
                  "rounded-2xl border px-4 py-2.5 text-sm font-medium transition",
                  filter === mode
                    ? "border-accent/30 bg-accent/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                {mode === "all" ? "All" : mode === "photo" ? "Photos" : "Videos"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Thumb size</span>
            {(["standard", "compact"] as const).map((sizeMode) => (
              <button
                key={sizeMode}
                type="button"
                onClick={() => setThumbnailSize(sizeMode)}
                className={clsx(
                  "rounded-2xl border px-4 py-2.5 text-sm font-medium transition",
                  thumbnailSize === sizeMode
                    ? "border-accent/30 bg-accent/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                {sizeMode === "standard" ? "Standard" : "Compact"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {visibleAssets.length === 0 ? (
        <PlaceholderCard
          title="No assets in this filter"
          body="Try switching between all assets, photos, and videos. This model stays separate from the main library browser, so only files inside the chosen model folder will appear here."
        />
      ) : (
        <section
          className={clsx(
            "grid gap-3",
            thumbnailSize === "compact"
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
              : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
          )}
        >
          {visibleAssets.map((asset) => {
            const previewUrl = asset.assetType === "photo" ? asset.assetUrl : asset.thumbnailPath;

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedAssetId(asset.id)}
                className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1016] text-left shadow-panel transition hover:border-accent/30 hover:bg-white/[0.03]"
              >
                <div
                  className={clsx(
                    "relative overflow-hidden bg-[#080b10]",
                    thumbnailSize === "compact" ? "aspect-[5/6]" : "aspect-[4/5]",
                  )}
                >
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt={asset.fileName}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">
                      {asset.assetType === "photo" ? (
                        <ImageIcon className="h-9 w-9" />
                      ) : (
                        <PlayCircle className="h-9 w-9" />
                      )}
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                        {asset.assetType}
                      </span>
                      <span className="truncate text-xs text-slate-200">{asset.folderPath}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-medium text-white">{asset.fileName}</p>
                  <p className="truncate text-xs uppercase tracking-[0.18em] text-slate-500">
                    {asset.relativePath}
                  </p>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {selectedAsset ? (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-[1560px] flex-col gap-4 xl:flex-row">
            <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#05070a] p-4 shadow-panel">
              {selectedAsset.assetType === "photo" ? (
                <img
                  src={selectedAsset.assetUrl}
                  alt={selectedAsset.fileName}
                  className="max-h-full max-w-full rounded-2xl object-contain"
                />
              ) : (
                <video
                  src={selectedAsset.assetUrl}
                  className="max-h-full max-w-full rounded-2xl"
                  controls
                  autoPlay
                />
              )}

              <button
                type="button"
                onClick={() => setSelectedAssetId(null)}
                className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-slate-200 transition hover:bg-black/55 hover:text-white"
                aria-label="Close viewer"
              >
                <X className="h-5 w-5" />
              </button>

              {visibleAssets.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAssetId(
                        visibleAssets[Math.max(selectedIndex - 1, 0)]?.id ?? selectedAsset.id,
                      )
                    }
                    className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-slate-200 transition hover:bg-black/55 hover:text-white"
                    aria-label="Previous asset"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAssetId(
                        visibleAssets[Math.min(selectedIndex + 1, visibleAssets.length - 1)]?.id ??
                          selectedAsset.id,
                      )
                    }
                    className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-slate-200 transition hover:bg-black/55 hover:text-white"
                    aria-label="Next asset"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>

            <aside className="w-full shrink-0 rounded-[28px] border border-white/10 bg-surface/90 p-5 shadow-panel xl:w-[380px]">
              <p className="text-sm uppercase tracking-[0.22em] text-accent">Selected asset</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
                {selectedAsset.fileName}
              </h3>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => void setAsModelCover()}
                  disabled={Boolean(coverSavingAssetId)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {coverSavingAssetId === selectedAsset.id ? (
                    <LoaderCircle className="h-4 w-4" />
                  ) : null}
                  {model.coverAssetId === selectedAsset.id ? "Current model cover" : "Use as model cover"}
                </button>
              </div>
              {coverMessage ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {coverMessage}
                </div>
              ) : null}
              {coverError ? (
                <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {coverError}
                </div>
              ) : null}
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <InfoRow label="Type" value={selectedAsset.assetType} />
                <InfoRow label="Folder" value={selectedAsset.folderPath} />
                <InfoRow label="Path" value={selectedAsset.relativePath} />
                <InfoRow label="Extension" value={selectedAsset.extension} />
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 break-all text-sm text-white">{value}</p>
    </div>
  );
}
