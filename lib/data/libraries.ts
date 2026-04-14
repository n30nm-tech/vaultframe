import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStorageAvailabilityMap } from "@/lib/server/storage-status";

export type LibraryRecord = {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  mediaFileCount: number;
  scanStatus: string;
  scanQueuedAt: Date | null;
  scanStartedAt: Date | null;
  scanFinishedAt: Date | null;
  scanCurrentPath: string | null;
  scanPendingFiles: string[];
  scanTotalFiles: number;
  scanFilesScanned: number;
  scanVideosFound: number;
  scanError: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastScannedAt: Date | null;
  storageAvailable: boolean;
  storageMessage: string | null;
};

export type LibraryFormValues = {
  name: string;
  path: string;
  enabled: boolean;
};

export async function listLibraries(): Promise<LibraryRecord[]> {
  const libraries = await prisma.library.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  const mediaCounts = await prisma.mediaItem.groupBy({
    by: ["libraryId"],
    where: {
      missing: false,
    },
    _count: {
      _all: true,
    },
  });

  const statuses = await getStorageAvailabilityMap(
    libraries.map((library) => ({
      id: library.id,
      path: library.path,
    })),
  );

  return libraries.map((library) => {
    const status = statuses.get(library.id);
    const mediaCount = mediaCounts.find((entry) => entry.libraryId === library.id);

    return {
      ...library,
      mediaFileCount: mediaCount?._count._all ?? 0,
      storageAvailable: status?.available ?? false,
      storageMessage: status?.message ?? "The library folder is currently unavailable.",
    };
  }) as LibraryRecord[];
}

export async function createLibrary(values: LibraryFormValues) {
  try {
    return await prisma.library.create({
      data: values,
    });
  } catch (error) {
    throw mapLibraryError(error);
  }
}

export async function updateLibrary(id: string, values: LibraryFormValues) {
  try {
    return await prisma.library.update({
      where: { id },
      data: values,
    });
  } catch (error) {
    throw mapLibraryError(error);
  }
}

export async function deleteLibrary(id: string) {
  try {
    return await prisma.library.delete({
      where: { id },
    });
  } catch (error) {
    throw mapLibraryError(error);
  }
}

export async function toggleLibraryEnabled(id: string, enabled: boolean) {
  try {
    return await prisma.library.update({
      where: { id },
      data: { enabled },
    });
  } catch (error) {
    throw mapLibraryError(error);
  }
}

export async function updateLibraryScanState(
  id: string,
  data: {
    scanStatus?: string;
    scanQueuedAt?: Date | null;
    scanStartedAt?: Date | null;
    scanFinishedAt?: Date | null;
    scanCurrentPath?: string | null;
    scanPendingFiles?: string[];
    scanTotalFiles?: number;
    scanFilesScanned?: number;
    scanVideosFound?: number;
    scanError?: string | null;
    lastScannedAt?: Date | null;
  },
) {
  return prisma.library.update({
    where: { id },
    data: data as never,
  });
}

function mapLibraryError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new Error("A library with that path already exists.");
  }

  return new Error("Unable to save the library right now.");
}
