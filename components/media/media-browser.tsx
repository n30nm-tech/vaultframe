"use client";

import { useState } from "react";
import { Film, SearchX } from "lucide-react";
import { MediaCardPlayer } from "@/components/media/media-card-player";
import { MediaFilterBar } from "@/components/media/media-filter-bar";
import type { getMediaBrowserData } from "@/lib/data/media";

type MediaBrowserProps = {
  data: Awaited<ReturnType<typeof getMediaBrowserData>>;
};

export function MediaBrowser({ data }: MediaBrowserProps) {
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const hasMedia = data.totalCount > 0;
  const hasResults = data.filteredCount > 0;
  const hasLibraries = data.libraries.length > 0;
  const thumbnailOnlyView = data.filters.view === "thumbnails";

  return (
    <div className="space-y-6">
      <MediaFilterBar
        filters={data.filters}
        libraries={data.libraries}
        folders={data.folders}
        tags={data.tags.map((tag) => tag.name)}
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
              Showing <span className="font-medium text-white">{data.filteredCount}</span> of{" "}
              <span className="font-medium text-white">{data.totalCount}</span> media items
            </p>
          </div>

          <section
            className={
              thumbnailOnlyView
                ? "grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
                : "grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            }
          >
            {data.mediaItems.map((mediaItem) => (
              <MediaCardPlayer
                key={mediaItem.id}
                mediaItem={mediaItem}
                activeMediaId={activeMediaId}
                thumbnailOnlyView={thumbnailOnlyView}
                onActivate={(id) => setActiveMediaId(id)}
                onDeactivate={(id) =>
                  setActiveMediaId((current) => (current === id ? null : current))
                }
              />
            ))}
          </section>
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
