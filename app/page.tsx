import { Database, FolderTree, PlaySquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderCard } from "@/components/ui/placeholder-card";

const overview = [
  {
    title: "Persistent libraries",
    body: "Library folders will be stored in PostgreSQL through Prisma models so sources survive restarts and redeploys.",
    meta: "Ready for Phase 2",
    icon: FolderTree,
  },
  {
    title: "Scanned media records",
    body: "Indexed video records have a dedicated schema path, keeping media metadata persistent and queryable.",
    meta: "Database foundation in place",
    icon: Database,
  },
  {
    title: "Playback grid",
    body: "The media experience will support in-card HTML5 playback and expanded viewing modes in the next implementation phase.",
    meta: "UI route prepared",
    icon: PlaySquare,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title="A polished foundation for a self-hosted media vault"
        description="Phase 1 establishes the application shell, persistence layer, and containerized deployment baseline without reaching into scanning or playback logic yet."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {overview.map((item) => (
          <div key={item.title} className="rounded-3xl border border-white/10 bg-surface-muted/80 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <item.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{item.body}</p>
            <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-500">{item.meta}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <PlaceholderCard
          title="Deployment baseline"
          body="Docker Compose provisions the Next.js app alongside PostgreSQL, with Prisma migrations ready for startup deployment."
          meta="Next.js + Prisma + PostgreSQL + Docker"
        />
        <PlaceholderCard
          title="Current scope"
          body="Dashboard, Libraries, Media, and Settings routes are scaffolded and styled so we can layer real workflows on top without reworking the shell."
          meta="Phase 1 complete surface area"
        />
      </section>
    </div>
  );
}
