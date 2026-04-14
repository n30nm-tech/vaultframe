export default function LibrariesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="h-10 w-72 animate-pulse rounded-full bg-white/[0.08]" />
      </div>

      <div className="h-40 animate-pulse rounded-[28px] border border-white/10 bg-surface/80 shadow-panel" />

      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-surface/80 shadow-panel"
          />
        ))}
      </div>
    </div>
  );
}
