import { PageHeader } from "@/components/layout/page-header";
import { MediaBrowser } from "@/components/media/media-browser";
import { getMediaBrowserData, type MediaSort } from "@/lib/data/media";

export const dynamic = "force-dynamic";

type MediaPageProps = {
  searchParams?: Promise<{
    search?: string;
    libraryId?: string;
    missing?: "all" | "missing" | "available";
    folder?: string;
    sort?: MediaSort;
  }>;
};

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const data = await getMediaBrowserData({
    search: params?.search,
    libraryId: params?.libraryId,
    missing: params?.missing,
    folder: params?.folder,
    sort: params?.sort,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Media"
        title="Browse scanned media"
        description="Search, filter, and sort persisted media records across your saved libraries."
      />
      <MediaBrowser data={data} />
    </div>
  );
}
