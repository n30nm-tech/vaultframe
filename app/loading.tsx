function LoadingCard() {
  return <div className="h-24 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.04]" />;
}

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="h-10 w-72 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-white/[0.05]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[28px] border border-white/10 bg-surface/70" />
        <div className="h-72 animate-pulse rounded-[28px] border border-white/10 bg-surface/70" />
      </div>
    </div>
  );
}
