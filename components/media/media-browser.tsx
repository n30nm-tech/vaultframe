"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, SearchX } from "lucide-react";
import { MediaCardPlayer } from "@/components/media/media-card-player";
import { MediaFilterBar } from "@/components/media/media-filter-bar";
import type { getMediaBrowserData } from "@/lib/data/media";

type MediaBrowserProps = {
  data: Awaited<ReturnType<typeof getMediaBrowserData>>;
};

export function MediaBrowser({ data }: MediaBrowserProps) {
  const router = useRouter();
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const hasMedia = data.totalCount > 0;
  const hasResults = data.filteredCount > 0;
  const hasLibraries = data.libraries.length > 0;
  const thumbnailOnlyView = data.filters.view === "thumbnails";
  const compactDensity = data.filters.thumbnailDensity === "compact";
  const rangeStart = hasResults ? (data.currentPage - 1) * data.pageSize + 1 : 0;
  const rangeEnd = hasResults ? rangeStart + data.visibleCount - 1 : 0;

  const changePage = (page: number) => {
    const query = new URLSearchParams();

    if (data.filters.search) query.set("search", data.filters.search);
    if (data.filters.libraryId) query.set("libraryId", data.filters.libraryId);
    if (data.filters.missing !== "all") query.set("missing", data.filters.missing);
    if (data.filters.folder) query.set("folder", data.filters.folder);
    if (data.filters.tag) query.set("tag", data.filters.tag);
    if (data.filters.sort !== "updated-desc") query.set("sort", data.filters.sort);
    if (data.filters.view !== "details") query.set("view", data.filters.view);
    if (data.filters.thumbnailDensity !== "standard") {
      query.set("thumbnailDensity", data.filters.thumbnailDensity);
    }
    if (data.filters.thumbnailBadge !== "library") {
      query.set("thumbnailBadge", data.filters.thumbnailBadge);
    }
    if (data.filters.pageSize !== 100) query.set("pageSize", String(data.filters.pageSize));
    if (page > 1) query.set("page", String(page));

    router.push(query.size > 0 ? `/media?${query.toString()}` : "/media");
  };

  return (
    <div className="space-y-6">
      <MediaFilterBar
        filters={data.filters}
        libraries={data.libraries}
        folders={data.folders}
        tags={data.tags.map((tag) => tag.name)}
        pageSizeOptions={data.pageSizeOptions}
      />

      {!hasLibraries ? (
        <EmptyState
          title="No libraries configured"
          body="Add a library first, then run a scan to populate the media browser."
          icon={<Film className="h-7 w-7" />}
        />
      ) : !hasMedia ? (
        <EmptyState
          title="No scanned media yet"
          body="Run a library scan first to populate media records here."
          icon={<Film className="h-7 w-7" />}
        />
      ) : !hasResults ? (
        <EmptyState
          title="No results match these filters"
          body="Try a broader search or clear one of the active filters."
          icon={<SearchX className="h-7 w-7" />}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Showing <span className="font-medium text-white">{rangeStart}-{rangeEnd}</span> of{" "}
              <span className="font-medium text-white">{data.filteredCount}</span> matching items
              {data.filteredCount !== data.totalCount ? (
                <>
                  {" "}from <span className="font-medium text-white">{data.totalCount}</span> total
                </>
              ) : null}
            </p>
          </div>

          <section
            className={
              thumbnailOnlyView
                ? compactDensity
                  ? "grid gap-2 grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8"
                  : "grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
                : compactDensity
                  ? "grid gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                  : "grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            }
          >
            {data.mediaItems.map((mediaItem) => (
              <MediaCardPlayer
                key={mediaItem.id}
                mediaItem={mediaItem}
                activeMediaId={activeMediaId}
                thumbnailOnlyView={thumbnailOnlyView}
                compactDensity={compactDensity}
                thumbnailBadgeMode={data.filters.thumbnailBadge}
                onActivate={(id) => setActiveMediaId(id)}
                onDeactivate={(id) =>
                  setActiveMediaId((current) => (current === id ? null : current))
                }
              />
            ))}
          </section>

          {data.totalPages > 1 ? (
            <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-400">
                Page <span className="font-medium text-white">{data.currentPage}</span> of{" "}
                <span className="font-medium text-white">{data.totalPages}</span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={data.currentPage <= 1}
                  onClick={() => changePage(data.currentPage - 1)}
                  className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={data.currentPage >= data.totalPages}
                  onClick={() => changePage(data.currentPage + 1)}
                  className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function EmptyState({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] px-5 py-12 text-center sm:rounded-[32px] sm:px-8 sm:py-16">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/10 text-accent">
        {icon}
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">{body}</p>
    </section>
  );
}
