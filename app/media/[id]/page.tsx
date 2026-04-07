import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getMediaItemById } from "@/lib/data/media";
import { Film, FolderTree, HardDrive, TriangleAlert } from "lucide-react";

type MediaDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const { id } = await params;
  const mediaItem = await getMediaItemById(id);

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

  return (
    <div>
      <PageHeader
        eyebrow="Media"
        title={mediaItem.title?.trim() || mediaItem.fileName}
        description="Thumbnail preview and basic metadata are available here. Playback is not part of this phase."
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-surface/80 shadow-panel">
          {mediaItem.thumbnailPath ? (
            <div className="relative aspect-video">
              <Image
                src={mediaItem.thumbnailPath}
                alt={mediaItem.title?.trim() || mediaItem.fileName}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-accent/10 text-accent">
                <Film className="h-10 w-10" />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
          <div className="space-y-5 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-slate-500" />
              <span>{mediaItem.library.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-slate-500" />
              <span className="break-all">{mediaItem.folderPath}</span>
            </div>
            <div className="break-all text-slate-400">{mediaItem.fullPath}</div>
            {mediaItem.missing ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                <TriangleAlert className="h-3.5 w-3.5" />
                Missing
              </div>
            ) : null}
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
