import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export type MediaQueryParams = {
  search?: string;
  libraryId?: string;
  missing?: "all" | "missing" | "available";
  folder?: string;
  sort?: MediaSort;
};

export async function getMediaBrowserData(params: MediaQueryParams) {
  const search = params.search?.trim() ?? "";
  const folder = params.folder?.trim() ?? "";
  const missing = params.missing ?? "all";
  const sort = params.sort ?? "updated-desc";

  const where: Prisma.MediaItemWhereInput = {
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
          ],
        }
      : {}),
  };

  const [mediaItems, libraries, folders, totalCount] = await Promise.all([
    prisma.mediaItem.findMany({
      where,
      include: {
        library: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: getOrderBy(sort),
    }),
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
    prisma.mediaItem.count(),
  ]);

  return {
    mediaItems,
    libraries,
    folders: folders.map((item) => item.folderPath),
    totalCount,
    filteredCount: mediaItems.length,
    filters: {
      search,
      libraryId: params.libraryId ?? "",
      missing,
      folder,
      sort,
    },
  };
}

export async function getMediaItemById(id: string) {
  return prisma.mediaItem.findUnique({
    where: { id },
    include: {
      library: {
        select: {
          id: true,
          name: true,
          path: true,
        },
      },
    },
  });
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
