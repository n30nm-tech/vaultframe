import type { ReactNode } from "react";

type PlaceholderCardProps = {
  title: string;
  body: string;
  meta?: string;
  action?: ReactNode;
};

export function PlaceholderCard({ title, body, meta, action }: PlaceholderCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-surface/80 p-6 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">{body}</p>
        </div>
        {action}
      </div>
      {meta ? <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">{meta}</p> : null}
    </div>
  );
}
