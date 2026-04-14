import { cookies } from "next/headers";
import { PageHeader } from "@/components/layout/page-header";
import { MediaBrowser } from "@/components/media/media-browser";
import {
  getMediaBrowserData,
  type MediaSort,
  type MediaThumbnailBadgeMode,
  type MediaThumbnailDensity,
  type MediaViewMode,
} from "@/lib/data/media";

export const dynamic = "force-dynamic";

type MediaPageProps = {
  searchParams?: Promise<{
    search?: string;
    libraryId?: string;
    missing?: "all" | "missing" | "available";
    folder?: string;
    tag?: string;
    sort?: MediaSort;
    view?: MediaViewMode;
    thumbnailDensity?: MediaThumbnailDensity;
    thumbnailBadge?: MediaThumbnailBadgeMode;
    page?: string;
    pageSize?: string;
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
    tag: params?.tag ?? storedFilters?.tag,
    sort: params?.sort ?? storedFilters?.sort,
    view: params?.view ?? storedFilters?.view,
    thumbnailDensity: params?.thumbnailDensity ?? storedFilters?.thumbnailDensity,
    thumbnailBadge: params?.thumbnailBadge ?? storedFilters?.thumbnailBadge,
    page: Number(params?.page ?? 1),
    pageSize: Number(params?.pageSize ?? storedFilters?.pageSize ?? 100),
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
      tag?: string;
      sort?: MediaSort;
      view?: MediaViewMode;
      thumbnailDensity?: MediaThumbnailDensity;
      thumbnailBadge?: MediaThumbnailBadgeMode;
      pageSize?: number;
    };

    return {
      search: parsed.search ?? "",
      libraryId: parsed.libraryId ?? "",
      missing: parsed.missing ?? "all",
      folder: parsed.folder ?? "",
      tag: parsed.tag ?? "",
      sort: parsed.sort ?? "updated-desc",
      view: parsed.view ?? "details",
      thumbnailDensity: parsed.thumbnailDensity ?? "standard",
      thumbnailBadge: parsed.thumbnailBadge ?? "library",
      pageSize: parsed.pageSize ?? 100,
    };
  } catch {
    return undefined;
  }
}
