import { cookies } from "next/headers";
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
  const cookieStore = await cookies();
  const storedFilterValue = cookieStore.get("vaultframe-media-filters")?.value;
  const storedFilters = storedFilterValue
    ? parseStoredMediaFilters(storedFilterValue)
    : undefined;
  const data = await getMediaBrowserData({
    search: params?.search ?? storedFilters?.search,
    libraryId: params?.libraryId ?? storedFilters?.libraryId,
    missing: params?.missing ?? storedFilters?.missing,
    folder: params?.folder ?? storedFilters?.folder,
    sort: params?.sort ?? storedFilters?.sort,
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

function parseStoredMediaFilters(value: string) {
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as {
      search?: string;
      libraryId?: string;
      missing?: "all" | "missing" | "available";
      folder?: string;
      sort?: MediaSort;
    };

    return {
      search: parsed.search ?? "",
      libraryId: parsed.libraryId ?? "",
      missing: parsed.missing ?? "all",
      folder: parsed.folder ?? "",
      sort: parsed.sort ?? "updated-desc",
    };
  } catch {
    return undefined;
  }
}
