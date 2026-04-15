import Image from "next/image";
import { Check, ImagePlus } from "lucide-react";
import { setMediaPosterFromStoryboardFormAction } from "@/app/media/[id]/actions";

type PosterFramePickerProps = {
  mediaId: string;
  title: string;
  posterPath: string | null;
  storyboards: Array<{
    path: string;
    timestamp: number;
  }>;
};

export function PosterFramePicker({
  mediaId,
  title,
  posterPath,
  storyboards,
}: PosterFramePickerProps) {
  if (storyboards.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white">Set Poster</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Choose any existing storyboard frame and save it as this video’s poster thumbnail.
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {storyboards.length} frames
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {storyboards.map((storyboard, index) => {
          const isCurrentPoster = storyboard.path === posterPath;

          return (
            <form key={storyboard.path} action={setMediaPosterFromStoryboardFormAction}>
              <input type="hidden" name="mediaItemId" value={mediaId} />
              <input type="hidden" name="storyboardPath" value={storyboard.path} />

              <button
                type="submit"
                disabled={isCurrentPoster}
                className={`group block w-full text-left transition ${
                  isCurrentPoster ? "cursor-default" : "hover:opacity-100"
                }`}
              >
                <div
                  className={`relative aspect-video overflow-hidden rounded-[22px] border bg-black/30 ${
                    isCurrentPoster
                      ? "border-emerald-400/40 ring-1 ring-emerald-400/30"
                      : "border-white/10 group-hover:border-accent/30"
                  }`}
                >
                  <Image
                    src={storyboard.path}
                    alt={`${title} poster option ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-3 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      Frame {index + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        isCurrentPoster
                          ? "border-emerald-300/30 bg-emerald-400/20 text-emerald-100"
                          : "border-white/15 bg-black/55 text-white"
                      }`}
                    >
                      {isCurrentPoster ? (
                        <>
                          <Check className="h-3 w-3" />
                          Current
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-3 w-3" />
                          Use
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
