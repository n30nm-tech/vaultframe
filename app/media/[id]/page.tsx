import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { MediaDetailPlayer } from "@/components/media/media-detail-player";
import { MediaTagManager } from "@/components/media/media-tag-manager";
import { getMediaItemById } from "@/lib/data/media";
import { listTags } from "@/lib/data/tags";
import { formatDuration, formatFileSize, getFolderBreadcrumbLabel } from "@/lib/media-presentation";
import { FolderTree, HardDrive, TriangleAlert } from "lucide-react";

type MediaDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const { id } = await params;
  const [mediaItem, allTags] = await Promise.all([getMediaItemById(id), listTags()]);

  if (!mediaItem) {
    return (
      <div>
        <PageHeader
          eyebrow="Media"
          title="Media item not found"
          description="This media record does not exist."
        />
      </div>
    );
  }

  const storyboards = mediaItem.storyboardPaths.map((path, index) => ({
    path,
    timestamp: mediaItem.storyboardTimestamps[index] ?? 0,
  }));
  const folderLabel = getFolderBreadcrumbLabel(mediaItem.folderPath, mediaItem.library.path);
  const availableTags = allTags.filter(
    (tag) => !mediaItem.tags.some((assignedTag) => assignedTag.id === tag.id),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Media"
        title={mediaItem.title?.trim() || mediaItem.fileName}
        description="Play the media, review storyboard frames, and inspect the stored record details."
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-surface/80 shadow-panel">
            <MediaDetailPlayer
              mediaId={mediaItem.id}
              title={mediaItem.title?.trim() || mediaItem.fileName}
              posterPath={mediaItem.thumbnailPath}
              missing={mediaItem.missing}
              storyboards={storyboards}
            />
          </div>

          <MediaTagManager
            mediaItemId={mediaItem.id}
            tags={mediaItem.tags}
            availableTags={availableTags}
          />
        </div>

        <div className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
          <div className="space-y-5 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-slate-500" />
              <span>{mediaItem.library.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-slate-500" />
              <span>{folderLabel}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span>{formatDuration(mediaItem.durationSeconds)}</span>
                <span>{formatFileSize(mediaItem.sizeBytes)}</span>
                <span>{mediaItem.extension.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-slate-500" />
              <span className="break-all">{mediaItem.folderPath}</span>
            </div>
            <div className="break-all text-slate-400">{mediaItem.fullPath}</div>
            <div className="flex flex-wrap items-center gap-2">
              {mediaItem.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/media?tag=${encodeURIComponent(tag.name)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {tag.name}
                </Link>
              ))}
              {!mediaItem.library.storageAvailable ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-200">
                  <HardDrive className="h-3.5 w-3.5" />
                  Storage offline
                </div>
              ) : null}
              {mediaItem.missing ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  Missing
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
              <Link
                href={`/media?folder=${encodeURIComponent(mediaItem.folderPath)}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
              >
                Show All From Folder
              </Link>
              <Link
                href={`/media?libraryId=${encodeURIComponent(mediaItem.library.id)}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
              >
                Show All From Library
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
