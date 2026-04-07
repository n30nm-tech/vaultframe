import Image from "next/image";
import Link from "next/link";
import { Film, FolderTree, HardDrive, TriangleAlert } from "lucide-react";

type MediaCardProps = {
  mediaItem: {
    id: string;
    title: string | null;
    thumbnailPath: string | null;
    fileName: string;
    folderPath: string;
    missing: boolean;
    updatedAt: Date;
    library: {
      id: string;
      name: string;
    };
  };
};

export function MediaCard({ mediaItem }: MediaCardProps) {
  return (
    <Link
      href={`/media/${mediaItem.id}`}
      className="group block rounded-[28px] border border-white/10 bg-surface/80 p-4 shadow-panel transition hover:border-accent/20 hover:bg-surface-muted/80"
    >
      {mediaItem.thumbnailPath ? (
        <div className="relative aspect-video overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
          <Image
            src={mediaItem.thumbnailPath}
            alt={mediaItem.title?.trim() || mediaItem.fileName}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/10 text-accent">
            <Film className="h-8 w-8" />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold tracking-tight text-white">
            {mediaItem.title?.trim() || mediaItem.fileName}
          </h3>
          <p className="mt-2 truncate text-sm text-slate-400">{mediaItem.fileName}</p>
        </div>
        {mediaItem.missing ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
            <TriangleAlert className="h-3.5 w-3.5" />
            Missing
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 shrink-0" />
          <span className="truncate">{mediaItem.library.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 shrink-0" />
          <span className="truncate">{mediaItem.folderPath}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs uppercase tracking-[0.16em] text-slate-500">
        <span>{mediaItem.thumbnailPath ? "Poster ready" : "Poster pending"}</span>
        <span>Open details</span>
      </div>
    </Link>
  );
}
