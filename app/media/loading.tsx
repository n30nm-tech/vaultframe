export default function MediaLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-20 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="h-10 w-64 animate-pulse rounded-full bg-white/[0.08]" />
      </div>

      <div className="rounded-[28px] border border-white/10 bg-surface/80 p-6 shadow-panel">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div className="h-12 animate-pulse rounded-2xl bg-white/[0.05]" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/[0.05]" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/[0.05]" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/[0.05]" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[24px] border border-white/10 bg-surface/80 shadow-panel"
          >
            <div className="aspect-video animate-pulse bg-white/[0.05]" />
            <div className="space-y-3 p-4">
              <div className="h-4 animate-pulse rounded-full bg-white/[0.05]" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/[0.05]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
