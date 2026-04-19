import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ModelGallery } from "@/components/models/model-gallery";
import { ModelImportControls } from "@/components/models/model-import-controls";
import { getModelById } from "@/lib/data/models";
import { requirePageAuth } from "@/lib/server/auth";
import { ensureModelImportRunnerStarted } from "@/lib/server/model-import";

export const dynamic = "force-dynamic";

type ModelDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { id } = await params;
  await requirePageAuth(`/models/${id}`);
  ensureModelImportRunnerStarted();
  const model = await getModelById(id);

  if (!model) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Model"
          title={model.name}
          description={`Browse ${model.assetCount} curated assets from ${model.path}. Photos and videos stay together here, separate from the main library browser.`}
        />
        <Link
          href="/models"
          className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.04] hover:text-white"
        >
          Back To Models
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Assets" value={String(model.assetCount)} />
        <StatCard label="Photos" value={String(model.photoCount)} />
        <StatCard label="Videos" value={String(model.videoCount)} />
        <StatCard label="Folders" value={String(model.folderCount)} />
      </section>

      <ModelImportControls model={model} />

      <ModelGallery model={model} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-surface/80 p-5 shadow-panel">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
