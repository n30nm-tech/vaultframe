"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { addMediaTagAction, removeMediaTagAction, type MediaTagActionState } from "@/app/media/[id]/actions";

type MediaTagManagerProps = {
  mediaItemId: string;
  tags: Array<{
    id: string;
    name: string;
  }>;
};

const initialState: MediaTagActionState = {
  success: false,
};

export function MediaTagManager({ mediaItemId, tags }: MediaTagManagerProps) {
  const [state, formAction] = useActionState(addMediaTagAction, initialState);

  return (
    <div className="rounded-[32px] border border-white/10 bg-surface/80 p-6 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-white">Tags</h3>
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {tags.length} total
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <form key={tag.id} action={removeMediaTagAction}>
              <input type="hidden" name="mediaItemId" value={mediaItemId} />
              <input type="hidden" name="tagId" value={tag.id} />
              <RemoveTagButton name={tag.name} />
            </form>
          ))
        ) : (
          <p className="text-sm text-slate-400">No tags yet.</p>
        )}
      </div>

      <form action={formAction} className="mt-5">
        <input type="hidden" name="mediaItemId" value={mediaItemId} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="tagName"
            placeholder="Add a tag"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/40"
          />
          <AddTagButton />
        </div>
      </form>

      {state.error ? <p className="mt-3 text-sm text-rose-300">{state.error}</p> : null}
      {state.message ? <p className="mt-3 text-sm text-emerald-300">{state.message}</p> : null}
    </div>
  );
}

function AddTagButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Plus className="h-4 w-4" />
      {pending ? "Adding..." : "Add Tag"}
    </button>
  );
}

function RemoveTagButton({ name }: { name: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span>{name}</span>
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
