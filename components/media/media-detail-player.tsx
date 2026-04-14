"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { Check, Expand, Film, ImagePlus, Play, TriangleAlert } from "lucide-react";
import { setMediaPosterFromStoryboardFormAction } from "@/app/media/[id]/actions";

type PlayerSize = "small" | "medium" | "large";

type MediaDetailPlayerProps = {
  mediaId: string;
  title: string;
  posterPath: string | null;
  missing: boolean;
  storyboards: Array<{
    path: string;
    timestamp: number;
  }>;
};

export function MediaDetailPlayer({
  mediaId,
  title,
  posterPath,
  missing,
  storyboards,
}: MediaDetailPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerSize, setPlayerSize] = useState<PlayerSize>("small");
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  const [selectedStoryboardIndex, setSelectedStoryboardIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const playerWidthClass =
    playerSize === "large"
      ? "max-w-none"
      : playerSize === "medium"
        ? "max-w-4xl"
        : "max-w-2xl";
  const handleStoryboardSelect = (timestamp: number) => {
    setSeekTarget(timestamp);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (selectedStoryboardIndex <= storyboards.length - 1) {
      return;
    }

    setSelectedStoryboardIndex(0);
  }, [selectedStoryboardIndex, storyboards.length]);

  useEffect(() => {
    if (!isPlaying || seekTarget === null || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const applySeek = async () => {
      try {
        video.currentTime = seekTarget;
      } catch {
        return;
      }

      try {
        await video.play();
      } catch {
        return;
      }

      setSeekTarget(null);
    };

    if (video.readyState >= 1 && Number.isFinite(video.duration)) {
      void applySeek();
      return;
    }

    video.addEventListener("loadedmetadata", applySeek, { once: true });
    video.addEventListener("canplay", applySeek, { once: true });

    return () => {
      video.removeEventListener("loadedmetadata", applySeek);
      video.removeEventListener("canplay", applySeek);
    };
  }, [isPlaying, seekTarget]);

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
        <div className={clsx("mx-auto w-full transition-all duration-200", playerWidthClass)}>
          <div ref={frameRef} className="overflow-hidden rounded-[24px] border border-white/10 bg-black">
            <video
              ref={videoRef}
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

        {storyboards.length > 0 ? (
          <div className="border-t border-white/10 pt-4">
            <StoryboardScrubber
              mediaId={mediaId}
              storyboards={storyboards}
              title={title}
              posterPath={posterPath}
              selectedIndex={selectedStoryboardIndex}
              onSelectIndex={setSelectedStoryboardIndex}
              onPlayTimestamp={handleStoryboardSelect}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setSeekTarget(null);
          setIsPlaying(true);
        }}
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

      {storyboards.length > 0 ? (
        <div className="border-t border-white/10 px-4 py-4">
          <StoryboardScrubber
            mediaId={mediaId}
            storyboards={storyboards}
            title={title}
            posterPath={posterPath}
            selectedIndex={selectedStoryboardIndex}
            onSelectIndex={setSelectedStoryboardIndex}
            onPlayTimestamp={handleStoryboardSelect}
          />
        </div>
      ) : null}
    </div>
  );
}

function StoryboardScrubber({
  mediaId,
  storyboards,
  title,
  posterPath,
  selectedIndex,
  onSelectIndex,
  onPlayTimestamp,
}: {
  mediaId: string;
  storyboards: Array<{
    path: string;
    timestamp: number;
  }>;
  title: string;
  posterPath: string | null;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onPlayTimestamp: (timestamp: number) => void;
}) {
  const selectedStoryboard = storyboards[selectedIndex] ?? storyboards[0];
  const selectedIsPoster = selectedStoryboard?.path === posterPath;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Scene Scrubbing
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {selectedStoryboard ? (
            <button
              type="button"
              onClick={() => onPlayTimestamp(selectedStoryboard.timestamp)}
              className="inline-flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent transition hover:bg-accent/20"
            >
              <Play className="h-3.5 w-3.5" />
              Play From {formatTimestamp(selectedStoryboard.timestamp)}
            </button>
          ) : null}
          {selectedStoryboard ? (
            <form action={setMediaPosterFromStoryboardFormAction}>
              <input type="hidden" name="mediaItemId" value={mediaId} />
              <input type="hidden" name="storyboardPath" value={selectedStoryboard.path} />
              <SetPosterButton isCurrentPoster={selectedIsPoster} />
            </form>
          ) : null}
        </div>
      </div>

      {selectedStoryboard ? (
        <div className="group block w-full text-left">
          <div className="relative aspect-video overflow-hidden rounded-[24px] border border-white/10 bg-black/30 transition group-hover:border-accent/30">
            <Image
              src={selectedStoryboard.path}
              alt={`${title} scrub preview`}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
            <span>Selected scene</span>
            <span>{formatTimestamp(selectedStoryboard.timestamp)}</span>
          </div>
        </div>
      ) : null}

      {storyboards.length > 1 ? (
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={storyboards.length - 1}
            step={1}
            value={selectedIndex}
            onChange={(event) => onSelectIndex(Number(event.target.value))}
            className="w-full accent-[rgb(125,211,252)]"
          />
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-500">
            <span>Start</span>
            <span>
              Scene {selectedIndex + 1} of {storyboards.length}
            </span>
            <span>End</span>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {storyboards.map((storyboard, index) => (
          <button
            key={storyboard.path}
            type="button"
            onClick={() => onSelectIndex(index)}
            className="group text-left"
          >
            <div
              className={clsx(
                "relative aspect-video overflow-hidden rounded-2xl border bg-black/30 transition",
                index === selectedIndex
                  ? "border-accent/50 ring-1 ring-accent/40"
                  : "border-white/10 group-hover:border-accent/30",
              )}
            >
              <Image
                src={storyboard.path}
                alt={`${title} frame ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <span className="mt-2 block text-xs text-slate-400">
              {formatTimestamp(storyboard.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SetPosterButton({ isCurrentPoster }: { isCurrentPoster: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || isCurrentPoster}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isCurrentPoster ? <Check className="h-3.5 w-3.5" /> : <ImagePlus className="h-3.5 w-3.5" />}
      {pending ? "Saving..." : isCurrentPoster ? "Current Poster" : "Set As Poster"}
    </button>
  );
}

function formatTimestamp(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
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
