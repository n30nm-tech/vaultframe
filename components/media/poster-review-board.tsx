"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Check, ChevronLeft, ChevronRight, ImagePlus, Loader2 } from "lucide-react";
import type { getPosterReviewData } from "@/lib/data/media";
import { formatDuration, getFolderBreadcrumbLabel } from "@/lib/media-presentation";

type PosterReviewBoardProps = {
  data: Awaited<ReturnType<typeof getPosterReviewData>>;
};

export function PosterReviewBoard({ data }: PosterReviewBoardProps) {
  const [items, setItems] = useState(data.items);
  const [selectedId, setSelectedId] = useState<string | null>(data.items[0]?.id ?? null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [savingPath, setSavingPath] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(data.items);
    setSelectedId(data.items[0]?.id ?? null);
  }, [data.items]);

  const selectedIndex = Math.max(
    items.findIndex((item) => item.id === selectedId),
    0,
  );
  const selectedItem = items[selectedIndex] ?? null;

  const selectedStoryboards = useMemo(
    () =>
      (selectedItem?.storyboardPaths ?? []).slice(0, 8).map((path, index) => ({
        path,
        timestamp: selectedItem?.storyboardTimestamps[index] ?? 0,
      })),
    [selectedItem],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target &&
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedId(items[Math.max(selectedIndex - 1, 0)]?.id ?? selectedId);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedId(items[Math.min(selectedIndex + 1, items.length - 1)]?.id ?? selectedId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedId, selectedIndex]);

  const moveSelection = (offset: number) => {
    const nextIndex = Math.min(Math.max(selectedIndex + offset, 0), items.length - 1);
    setSelectedId(items[nextIndex]?.id ?? selectedId);
  };

  const updatePoster = async (storyboardPath: string) => {
    if (!selectedItem) {
      return;
    }

    setSavingPath(storyboardPath);
    setError(null);
    setNotice(null);

    const formData = new FormData();
    formData.set("storyboardPath", storyboardPath);

    try {
      const response = await fetch(`/api/media/${selectedItem.id}/poster?format=json`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Poster update failed.");
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                thumbnailPath: storyboardPath,
                posterSelectionMode: "CUSTOM",
              }
            : item,
        ),
      );
      setNotice("Poster updated.");

      if (autoAdvance && selectedIndex < items.length - 1) {
        setSelectedId(items[selectedIndex + 1]?.id ?? selectedId);
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Poster update failed.");
    } finally {
      setSavingPath(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-surface/80 p-4 shadow-panel sm:rounded-[32px] sm:p-6">
        <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto]">
          <Field label="Library">
            <select
              name="libraryId"
              defaultValue={data.filters.libraryId}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 [&_option]:bg-[#0c1016] [&_option]:text-white"
            >
              <option value="">All libraries</option>
              {data.libraries.map((library) => (
                <option key={library.id} value={library.id}>
                  {library.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Source folder">
            <input
              name="sourceFolder"
              list="poster-review-source-folders"
              defaultValue={data.filters.sourceFolder}
              placeholder="Any folder"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40"
            />
            <datalist id="poster-review-source-folders">
              {data.sourceFolders.map((folder) => (
                <option key={folder} value={folder} />
              ))}
            </datalist>
          </Field>

          <Field label="Poster state">
            <select
              name="posterState"
              defaultValue={data.filters.posterState}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-accent/40 [&_option]:bg-[#0c1016] [&_option]:text-white"
            >
              <option value="all">All posters</option>
              <option value="missing">Missing poster</option>
              <option value="auto">Auto / needs cleanup</option>
              <option value="custom">Curated poster</option>
            </select>
          </Field>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              name="recentOnly"
              value="1"
              defaultChecked={data.filters.recentOnly}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="h-4 w-4 rounded border-white/20 bg-white/[0.04]"
            />
            Recently scanned
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              name="needsReviewOnly"
              value="1"
              defaultChecked={data.filters.needsReviewOnly}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="h-4 w-4 rounded border-white/20 bg-white/[0.04]"
            />
            Needs review tag
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
            >
              Apply
            </button>
            <Link
              href="/media/posters"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
            >
              Reset
            </Link>
          </div>
        </form>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            {data.totalCount} video{data.totalCount === 1 ? "" : "s"} in the review queue.
          </p>
          <label className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(event) => setAutoAdvance(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/[0.04]"
            />
            Batch mode auto-advance
          </label>
        </div>
      </section>

      {!selectedItem ? (
        <section className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] px-5 py-12 text-center text-slate-400">
          No videos match the current poster review filters.
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Review Queue
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{selectedIndex + 1}</span>
                <span>/</span>
                <span>{items.length}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {items.map((item) => {
                const isSelected = item.id === selectedItem.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={clsx(
                      "overflow-hidden rounded-[24px] border text-left transition",
                      isSelected
                        ? "border-accent/40 bg-accent/10 ring-1 ring-accent/20"
                        : "border-white/10 bg-surface/70 hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="relative aspect-video overflow-hidden bg-black/40">
                      {item.thumbnailPath ? (
                        <Image
                          src={item.thumbnailPath}
                          alt={item.title?.trim() || item.fileName}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.16em] text-slate-500">
                          No poster
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="line-clamp-2 text-sm font-medium text-white">
                        {item.title?.trim() || item.fileName}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        {item.library.displayName} • {item.sourceFolderName}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em]">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-slate-300">
                          {item.posterSelectionMode === "CUSTOM" ? "Curated" : "Auto"}
                        </span>
                        {item.tags.some((tag) => tag.name.toLowerCase() === "needs-review") ? (
                          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-200">
                            Needs review
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {data.totalPages > 1 ? (
              <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-surface/70 p-4">
                <p className="text-sm text-slate-400">
                  Page {data.currentPage} of {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={buildPosterReviewUrl(data.filters, data.currentPage - 1)}
                    aria-disabled={data.currentPage <= 1}
                    className={clsx(
                      "rounded-xl border px-3 py-2 text-sm transition",
                      data.currentPage <= 1
                        ? "pointer-events-none border-white/10 text-slate-600"
                        : "border-white/10 text-slate-200 hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    Previous
                  </Link>
                  <Link
                    href={buildPosterReviewUrl(data.filters, data.currentPage + 1)}
                    aria-disabled={data.currentPage >= data.totalPages}
                    className={clsx(
                      "rounded-xl border px-3 py-2 text-sm transition",
                      data.currentPage >= data.totalPages
                        ? "pointer-events-none border-white/10 text-slate-600"
                        : "border-white/10 text-slate-200 hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    Next
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-5 rounded-[32px] border border-white/10 bg-surface/80 p-5 shadow-panel sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  {selectedItem.title?.trim() || selectedItem.fileName}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {selectedItem.library.displayName} • {selectedItem.sourceFolderName}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {getFolderBreadcrumbLabel(selectedItem.folderPath, selectedItem.library.path)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/media/${selectedItem.id}`}
                  className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Open details
                </Link>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
                  <div className="relative aspect-video">
                    {selectedItem.thumbnailPath ? (
                      <Image
                        src={selectedItem.thumbnailPath}
                        alt={selectedItem.title?.trim() || selectedItem.fileName}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.16em] text-slate-500">
                        No poster selected
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <span>{formatDuration(selectedItem.durationSeconds)}</span>
                    <span>{selectedItem.storyboardPaths.length} frames</span>
                    <span>{selectedItem.posterSelectionMode === "CUSTOM" ? "Curated poster" : "Auto poster"}</span>
                  </div>
                  {notice ? <p className="mt-3 text-emerald-300">{notice}</p> : null}
                  {error ? <p className="mt-3 text-rose-300">{error}</p> : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Poster Candidates
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveSelection(-1)}
                      disabled={selectedIndex === 0}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSelection(1)}
                      disabled={selectedIndex >= items.length - 1}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedStoryboards.map((storyboard, index) => {
                    const isCurrentPoster = storyboard.path === selectedItem.thumbnailPath;
                    const isSaving = savingPath === storyboard.path;

                    return (
                      <button
                        key={storyboard.path}
                        type="button"
                        onClick={() => void updatePoster(storyboard.path)}
                        disabled={isCurrentPoster || Boolean(savingPath)}
                        className={clsx(
                          "overflow-hidden rounded-[24px] border text-left transition",
                          isCurrentPoster
                            ? "border-emerald-400/30 ring-1 ring-emerald-400/20"
                            : "border-white/10 hover:border-accent/30 hover:bg-white/[0.03]",
                        )}
                      >
                        <div className="relative aspect-video overflow-hidden bg-black/30">
                          <Image
                            src={storyboard.path}
                            alt={`${selectedItem.title?.trim() || selectedItem.fileName} frame ${index + 1}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-3 py-2">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                              Frame {index + 1}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
                              {Math.max(Math.round(storyboard.timestamp), 0)}s
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 p-3">
                          <span className="text-sm text-slate-200">
                            {isCurrentPoster ? "Current poster" : "Use as poster"}
                          </span>
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                              isCurrentPoster
                                ? "border-emerald-300/30 bg-emerald-400/20 text-emerald-100"
                                : "border-white/10 bg-white/[0.03] text-white",
                            )}
                          >
                            {isSaving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isCurrentPoster ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <ImagePlus className="h-3 w-3" />
                            )}
                            {isCurrentPoster ? "Current" : isSaving ? "Saving" : "Set"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function buildPosterReviewUrl(
  filters: PosterReviewBoardProps["data"]["filters"],
  page: number,
) {
  const params = new URLSearchParams();

  if (filters.libraryId) params.set("libraryId", filters.libraryId);
  if (filters.sourceFolder) params.set("sourceFolder", filters.sourceFolder);
  if (filters.posterState !== "all") params.set("posterState", filters.posterState);
  if (filters.recentOnly) params.set("recentOnly", "1");
  if (filters.needsReviewOnly) params.set("needsReviewOnly", "1");
  if (page > 1) params.set("page", String(page));

  return params.size > 0 ? `/media/posters?${params.toString()}` : "/media/posters";
}
