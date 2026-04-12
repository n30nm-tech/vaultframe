import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDirectoryAvailability } from "@/lib/server/folder-browser";

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

export type MediaQueryParams = {
  search?: string;
  libraryId?: string;
  missing?: "all" | "missing" | "available";
  folder?: string;
  tag?: string;
  sort?: MediaSort;
  view?: MediaViewMode;
};

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

  const [mediaItems, libraries, folders, tags, totalCount] = await Promise.all([
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
  ];

  const libraryAvailability = new Map<string, boolean>();

  await Promise.all(
    Array.from(
      new Map(mediaItems.map((item) => [item.library.id, item.library.path])).entries(),
      async ([libraryId, libraryPath]) => {
        const status = await getDirectoryAvailability(libraryPath);
        libraryAvailability.set(libraryId, status.available);
      },
    ),
  );

  const enrichedMediaItems = mediaItems.map((mediaItem) => ({
    ...mediaItem,
    library: {
      ...mediaItem.library,
      storageAvailable: libraryAvailability.get(mediaItem.library.id) ?? false,
    },
  })) as MediaBrowserItemRecord[];

  return {
    mediaItems: enrichedMediaItems,
    libraries,
    folders: folders.map((item) => item.folderPath),
    tags,
    totalCount,
    filteredCount: enrichedMediaItems.length,
    filters: {
      search,
      libraryId: params.libraryId ?? "",
      missing,
      folder,
      tag,
      sort,
      view,
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

  const availability = await getDirectoryAvailability(mediaItem.library.path);

  return {
    ...mediaItem,
    library: {
      ...mediaItem.library,
      storageAvailable: availability.available,
    },
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
