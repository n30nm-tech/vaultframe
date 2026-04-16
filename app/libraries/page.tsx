import { PageHeader } from "@/components/layout/page-header";
import { LibrariesManager } from "@/components/libraries/libraries-manager";
import { listLibraries } from "@/lib/data/libraries";
import { requirePageAuth } from "@/lib/server/auth";
import { ensureScanRunnerStarted } from "@/lib/server/library-scan";

export const dynamic = "force-dynamic";

export default async function LibrariesPage() {
  await requirePageAuth("/libraries");
  ensureScanRunnerStarted();
  const libraries = await listLibraries();

  return (
    <div>
      <PageHeader
        eyebrow="Libraries"
        title="Manage saved library sources"
        description="Add, edit, enable, disable, and delete the persistent folder roots your media library will use. All changes are stored in PostgreSQL through Prisma."
      />
      <LibrariesManager libraries={libraries} />
    </div>
  );
}
