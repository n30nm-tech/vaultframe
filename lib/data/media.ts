import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStorageAvailabilityMap } from "@/lib/server/storage-status";
import { getSourceFolderName } from "@/lib/media-presentation";

export type MediaItemRecord = {
  id: string;
  libraryId: string;
  fullPath: string;
  folderPath: string;
  fileName: string;
  title: string | null;
  thumbnailPath: string | null;
  storyboardPaths: string[];
  storyboardTimestamps: number[];
  extension: string;
  sizeBytes: bigint | null;
  durationSeconds: number | null;
  missing: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
  tags: Array<{
    id: string;
    name: string;
  }>;
  library: {
    id: string;
    name: string;
    path: string;
    storageAvailable: boolean;
  };
  sourceFolderName: string;
};

export type MediaBrowserItemRecord = Omit<MediaItemRecord, "library"> & {
  library: {
    id: string;
    name: string;
    path: string;
    storageAvailable: boolean;
  };
};

export type MediaSort =
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc"
  | "title-asc"
  | "title-desc"
  | "filename-asc"
  | "filename-desc"
  | "library-asc"
  | "folder-asc"
  | "size-desc"
  | "size-asc";

export type MediaViewMode = "details" | "thumbnails";
export type MediaThumbnailDensity = "standard" | "compact";
export type MediaThumbnailBadgeMode = "library" | "frames";

export type MediaQueryParams = {
  search?: string;
  libraryId?: string;
  missing?: "all" | "missing" | "available";
  folder?: string;
  tag?: string;
  sort?: MediaSort;
  view?: MediaViewMode;
  thumbnailDensity?: MediaThumbnailDensity;
  thumbnailBadge?: MediaThumbnailBadgeMode;
  page?: number;
  pageSize?: number;
};

const DEFAULT_MEDIA_PAGE_SIZE = 100;
const ALLOWED_MEDIA_PAGE_SIZES = [50, 100, 200] as const;

export async function getMediaBrowserData(params: MediaQueryParams) {
  const prismaWithTag = prisma as typeof prisma & {
    tag: {
      findMany: (args: unknown) => Promise<Array<{ id: string; name: string }>>;
    };
  };
  const search = params.search?.trim() ?? "";
  const folder = params.folder?.trim() ?? "";
  const tag = params.tag?.trim() ?? "";
  const missing = params.missing ?? "all";
  const sort = params.sort ?? "updated-desc";
  const view = params.view ?? "details";
  const thumbnailDensity = params.thumbnailDensity ?? "standard";
  const thumbnailBadge = params.thumbnailBadge ?? "library";
  const requestedPageSize = params.pageSize ?? DEFAULT_MEDIA_PAGE_SIZE;
  const pageSize = ALLOWED_MEDIA_PAGE_SIZES.includes(
    requestedPageSize as (typeof ALLOWED_MEDIA_PAGE_SIZES)[number],
  )
    ? requestedPageSize
    : DEFAULT_MEDIA_PAGE_SIZE;
  const currentPage = Math.max(params.page ?? 1, 1);
  const skip = (currentPage - 1) * pageSize;

  const where: Record<string, unknown> = {
    ...(params.libraryId ? { libraryId: params.libraryId } : {}),
    ...(missing === "missing" ? { missing: true } : {}),
    ...(missing === "available" ? { missing: false } : {}),
    ...(folder
      ? {
          folderPath: {
            contains: folder,
            mode: "insensitive",
          },
        }
      : {}),
    ...(tag
      ? {
          tags: {
            some: {
              name: {
                equals: tag,
                mode: "insensitive",
              },
            },
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              fileName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              folderPath: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              tags: {
                some: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [mediaItems, libraries, folders, tags, totalCount, filteredCount] = await Promise.all([
    prisma.mediaItem.findMany({
      where: where as never,
      include: {
        tags: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        library: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      } as never,
      orderBy: getOrderBy(sort) as never,
      skip,
      take: pageSize,
    } as never),
    prisma.library.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.mediaItem.findMany({
      distinct: ["folderPath"],
      where: params.libraryId
        ? ({
            libraryId: params.libraryId,
          } as never)
        : undefined,
      orderBy: {
        folderPath: "asc",
      },
      select: {
        folderPath: true,
      },
      take: 100,
    }),
    prismaWithTag.tag.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }) as Promise<Array<{ id: string; name: string }>>,
    prisma.mediaItem.count({
      where: undefined,
    } as never),
    prisma.mediaItem.count({
      where: where as never,
    } as never),
  ]) as [
    Array<
      Omit<MediaBrowserItemRecord, "library"> & {
        library: {
          id: string;
          name: string;
          path: string;
        };
      }
    >,
    Array<{ id: string; name: string }>,
    Array<{ folderPath: string }>,
    Array<{ id: string; name: string }>,
    number,
    number,
  ];

  const libraryAvailability = await getStorageAvailabilityMap(
    Array.from(
      new Map(mediaItems.map((item) => [item.library.id, item.library.path])).entries(),
      ([id, path]) => ({
        id,
        path,
      }),
    ),
  );

  const enrichedMediaItems = mediaItems.map((mediaItem) => ({
    ...mediaItem,
    library: {
      ...mediaItem.library,
      storageAvailable: libraryAvailability.get(mediaItem.library.id)?.available ?? false,
    },
    sourceFolderName: getSourceFolderName(mediaItem.folderPath, mediaItem.library.path),
  })) as MediaBrowserItemRecord[];

  const sourceFolders = Array.from(new Set(
    enrichedMediaItems.map((mediaItem) => mediaItem.sourceFolderName).filter(Boolean),
  )).sort((a, b) => a.localeCompare(b));

  return {
    mediaItems: enrichedMediaItems,
    libraries,
    folders: folders.map((item) => item.folderPath),
    sourceFolders,
    tags,
    totalCount,
    filteredCount,
    visibleCount: enrichedMediaItems.length,
    currentPage,
    pageSize,
    totalPages: Math.max(Math.ceil(filteredCount / pageSize), 1),
    pageSizeOptions: [...ALLOWED_MEDIA_PAGE_SIZES],
    filters: {
      search,
      libraryId: params.libraryId ?? "",
      missing,
      folder,
      tag,
      sort,
      view,
      thumbnailDensity,
      thumbnailBadge,
      pageSize,
    },
  };
}

export async function getMediaItemById(id: string) {
  const mediaItem = (await prisma.mediaItem.findUnique({
    where: { id },
    include: {
      tags: {
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      library: {
        select: {
          id: true,
          name: true,
          path: true,
        },
      },
    } as never,
  } as never)) as MediaItemRecord | null;

  if (!mediaItem) {
    return null;
  }

  const availability = await getStorageAvailabilityMap([
    {
      id: mediaItem.library.id,
      path: mediaItem.library.path,
    },
  ]);

  return {
    ...mediaItem,
    library: {
      ...mediaItem.library,
      storageAvailable: availability.get(mediaItem.library.id)?.available ?? false,
    },
    sourceFolderName: getSourceFolderName(mediaItem.folderPath, mediaItem.library.path),
  } satisfies MediaItemRecord;
}

function getOrderBy(sort: MediaSort): Prisma.MediaItemOrderByWithRelationInput[] {
  switch (sort) {
    case "updated-asc":
      return [{ updatedAt: "asc" }];
    case "created-desc":
      return [{ createdAt: "desc" }];
    case "created-asc":
      return [{ createdAt: "asc" }];
    case "title-asc":
      return [{ title: "asc" }, { fileName: "asc" }];
    case "title-desc":
      return [{ title: "desc" }, { fileName: "asc" }];
    case "filename-asc":
      return [{ fileName: "asc" }];
    case "filename-desc":
      return [{ fileName: "desc" }];
    case "library-asc":
      return [{ library: { name: "asc" } }, { fileName: "asc" }];
    case "folder-asc":
      return [{ folderPath: "asc" }, { fileName: "asc" }];
    case "size-desc":
      return [{ sizeBytes: "desc" }, { fileName: "asc" }];
    case "size-asc":
      return [{ sizeBytes: "asc" }, { fileName: "asc" }];
    case "updated-desc":
    default:
      return [{ updatedAt: "desc" }];
  }
}
