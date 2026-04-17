import { PageHeader } from "@/components/layout/page-header";
import { ModelsManager } from "@/components/models/models-manager";
import { listModels } from "@/lib/data/models";
import { requirePageAuth } from "@/lib/server/auth";
import { ensureModelImportRunnerStarted } from "@/lib/server/model-import";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  await requirePageAuth("/models");
  ensureModelImportRunnerStarted();
  const models = await listModels();

  return (
    <div>
      <PageHeader
        eyebrow="Models"
        title="Curated model galleries"
        description="Keep model folders separate from the main archive, ingest each folder tree recursively, and browse photos and videos in a fast gallery-first view."
      />
      <ModelsManager models={models} />
    </div>
  );
}
