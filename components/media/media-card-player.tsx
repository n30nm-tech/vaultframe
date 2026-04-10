"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  Expand,
  Film,
  FolderTree,
  HardDrive,
  Pause,
  Play,
  Shrink,
  TriangleAlert,
} from "lucide-react";

type PlayerSize = "small" | "medium" | "large";

type MediaCardPlayerProps = {
  mediaItem: {
    id: string;
    title: string | null;
    thumbnailPath: string | null;
    storyboardPaths: string[];
    fileName: string;
    folderPath: string;
    missing: boolean;
    library: {
      id: string;
      name: string;
    };
  };
  activeMediaId: string | null;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
};

export function MediaCardPlayer({
  mediaItem,
  activeMediaId,
  onActivate,
  onDeactivate,
}: MediaCardPlayerProps) {
  const isActive = activeMediaId === mediaItem.id;
  const [playerSize, setPlayerSize] = useState<PlayerSize>("small");
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [hoverFrameIndex, setHoverFrameIndex] = useState(0);
  const [hoverPreviewActive, setHoverPreviewActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hoverPreviewActive || mediaItem.storyboardPaths.length < 2 || isActive) {
      setHoverFrameIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setHoverFrameIndex((current) => (current + 1) % mediaItem.storyboardPaths.length);
    }, 320);

    return () => {
      window.clearInterval(interval);
    };
  }, [hoverPreviewActive, isActive, mediaItem.storyboardPaths]);

  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();
      setPlayerSize("small");
    }
  }, [isActive]);

  const cardSpanClass =
    playerSize === "large"
      ? "sm:col-span-2 xl:col-span-3 2xl:col-span-4"
      : playerSize === "medium"
        ? "sm:col-span-2 xl:col-span-2"
        : "";
  const previewImagePath =
    hoverPreviewActive && mediaItem.storyboardPaths[hoverFrameIndex]
      ? mediaItem.storyboardPaths[hoverFrameIndex]
      : mediaItem.thumbnailPath || mediaItem.storyboardPaths[0] || null;
  const canPreviewStoryboard = !isActive && mediaItem.storyboardPaths.length > 1;
  const previewHint = hoverPreviewActive ? "Previewing" : "Tap preview";

  const handlePreviewToggle = () => {
    if (!canPreviewStoryboard) {
      return;
    }

    setHoverPreviewActive((current) => !current);
    setHoverFrameIndex(0);
  };

  return (
    <article
      className={`rounded-[24px] border border-white/10 bg-surface/80 p-4 shadow-panel transition sm:rounded-[28px] ${cardSpanClass}`}
    >
      <div className={clsx(isActive ? "space-y-4" : "flex items-start gap-3 sm:block")}>
      <div
        ref={frameRef}
        className={clsx(
          "overflow-hidden rounded-[24px] border border-white/10 bg-black/40",
          isActive ? "" : "w-36 shrink-0 sm:w-auto",
        )}
        onMouseEnter={() => {
          if (canPreviewStoryboard) {
            setHoverPreviewActive(true);
          }
        }}
        onMouseLeave={() => {
          if (canPreviewStoryboard) {
            setHoverPreviewActive(false);
            setHoverFrameIndex(0);
          }
        }}
      >
        {isActive && !mediaItem.missing ? (
          <div className="relative">
            <video
              ref={videoRef}
              src={`/api/media/${mediaItem.id}`}
              poster={mediaItem.thumbnailPath ?? undefined}
              controls
              autoPlay
              playsInline
              onPlay={() => onActivate(mediaItem.id)}
              onEnded={() => onDeactivate(mediaItem.id)}
              onError={() => {
                setPlaybackError("This video could not be played.");
                onDeactivate(mediaItem.id);
              }}
              className="aspect-[16/10] max-h-[42vh] w-full bg-black object-contain sm:aspect-video sm:max-h-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#090c11] px-3 py-3">
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
              <div className="flex flex-wrap items-center gap-2">
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
                <button
                  type="button"
                  onClick={() => onDeactivate(mediaItem.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <Shrink className="h-3.5 w-3.5" />
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : previewImagePath ? (
          <button
            type="button"
            onClick={handlePreviewToggle}
            disabled={!canPreviewStoryboard}
            className={clsx(
              "relative block h-24 w-full text-left sm:h-auto sm:aspect-video",
              canPreviewStoryboard ? "cursor-pointer" : "cursor-default",
            )}
            aria-label={
              canPreviewStoryboard
                ? hoverPreviewActive
                  ? "Stop storyboard preview"
                  : "Start storyboard preview"
                : "Poster preview"
            }
          >
            <Image
              src={previewImagePath}
              alt={mediaItem.title?.trim() || mediaItem.fileName}
              fill
              unoptimized
              className="object-cover"
            />
            {canPreviewStoryboard ? (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white sm:text-xs">
                <span className="hidden sm:inline">
                  {hoverPreviewActive ? "Previewing frames" : "Hover to preview"}
                </span>
                <span className="sm:hidden">{previewHint}</span>
                <span>{mediaItem.storyboardPaths.length} frames</span>
              </div>
            ) : null}
          </button>
        ) : (
          <div className="flex h-24 items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02] sm:h-auto sm:aspect-video">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent sm:h-16 sm:w-16 sm:rounded-3xl">
              <Film className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </div>
        )}
      </div>

      <div className={clsx("min-w-0 flex-1", isActive ? "" : "sm:mt-4")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold tracking-tight text-white sm:text-lg">
            {mediaItem.title?.trim() || mediaItem.fileName}
          </h3>
          <p className="mt-1 break-words text-xs text-slate-400 sm:mt-2 sm:text-sm">
            {mediaItem.fileName}
          </p>
        </div>
        {mediaItem.missing ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
            <TriangleAlert className="h-3.5 w-3.5" />
            Missing
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-2 text-xs text-slate-400 sm:mt-4 sm:space-y-3 sm:text-sm">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 shrink-0" />
          <span className="truncate">{mediaItem.library.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 shrink-0" />
          <span className="truncate">{mediaItem.folderPath}</span>
        </div>
      </div>

      {playbackError ? <p className="mt-3 text-sm text-rose-300">{playbackError}</p> : null}

      <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
        {mediaItem.missing ? (
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-500">
            Playback unavailable
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setPlaybackError(null);
              onActivate(mediaItem.id);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isActive ? "Playing" : "Play"}
          </button>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-slate-500">
          <span>
            {mediaItem.storyboardPaths.length > 0
              ? `${mediaItem.storyboardPaths.length} preview frames`
              : mediaItem.thumbnailPath
                ? "Poster ready"
                : "Poster pending"}
          </span>
          <Link href={`/media/${mediaItem.id}`} className="transition hover:text-white">
            Details
          </Link>
        </div>
      </div>
      </div>
      </div>
    </article>
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
      className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
        active
          ? "border-accent/30 bg-accent/10 text-white"
          : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
