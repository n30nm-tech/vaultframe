"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import clsx from "clsx";
import { Expand, Film, Play, TriangleAlert } from "lucide-react";

type PlayerSize = "small" | "medium" | "large";

type MediaDetailPlayerProps = {
  mediaId: string;
  title: string;
  posterPath: string | null;
  missing: boolean;
};

export function MediaDetailPlayer({
  mediaId,
  title,
  posterPath,
  missing,
}: MediaDetailPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerSize, setPlayerSize] = useState<PlayerSize>("small");
  const frameRef = useRef<HTMLDivElement | null>(null);

  const playerWidthClass =
    playerSize === "large"
      ? "max-w-none"
      : playerSize === "medium"
        ? "max-w-4xl"
        : "max-w-3xl";

  if (missing) {
    return posterPath ? (
      <div className="relative aspect-video">
        <Image src={posterPath} alt={title} fill unoptimized className="object-cover" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-4 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
          <TriangleAlert className="h-4 w-4" />
          Missing
        </div>
      </div>
    ) : (
      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-accent/10 text-accent">
          <Film className="h-10 w-10" />
        </div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="space-y-3 p-3 sm:p-4">
        <div className={clsx("mx-auto w-full", playerWidthClass)}>
          <div ref={frameRef} className="overflow-hidden rounded-[24px] border border-white/10 bg-black">
            <video
              src={`/api/media/${mediaId}`}
              poster={posterPath ?? undefined}
              controls
              autoPlay
              playsInline
              className="aspect-video w-full bg-black object-contain"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <SizeButton active={playerSize === "small"} onClick={() => setPlayerSize("small")}>
              Small
            </SizeButton>
            <SizeButton active={playerSize === "medium"} onClick={() => setPlayerSize("medium")}>
              Medium
            </SizeButton>
            <SizeButton active={playerSize === "large"} onClick={() => setPlayerSize("large")}>
              Large
            </SizeButton>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (frameRef.current) {
                await frameRef.current.requestFullscreen();
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Expand className="h-3.5 w-3.5" />
            Fullscreen
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden bg-black text-left"
    >
      {posterPath ? (
        <Image src={posterPath} alt={title} fill unoptimized className="object-cover transition duration-300 group-hover:scale-[1.02]" />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-accent/10 text-accent">
            <Film className="h-10 w-10" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/65 px-5 py-3 text-white shadow-2xl transition group-hover:bg-black/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-slate-950">
            <Play className="ml-0.5 h-5 w-5" />
          </div>
          <span className="text-sm font-semibold tracking-[0.08em]">Play Video</span>
        </div>
      </div>
    </button>
  );
}

function SizeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-xl border px-3 py-2 text-xs font-medium transition",
        active
          ? "border-accent/30 bg-accent/10 text-white"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
