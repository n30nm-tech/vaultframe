import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LibraryRecord = {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  scanStatus: string;
  scanStartedAt: Date | null;
  scanFinishedAt: Date | null;
  scanCurrentPath: string | null;
  scanFilesScanned: number;
  scanVideosFound: number;
  scanError: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastScannedAt: Date | null;
};

export type LibraryFormValues = {
  name: string;
  path: string;
  enabled: boolean;
};

export async function listLibraries(): Promise<LibraryRecord[]> {
  return prisma.library.findMany({
    orderBy: {
      createdAt: "desc",
    },
  }) as Promise<LibraryRecord[]>;
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
    scanStartedAt?: Date | null;
    scanFinishedAt?: Date | null;
    scanCurrentPath?: string | null;
    scanFilesScanned?: number;
    scanVideosFound?: number;
    scanError?: string | null;
    lastScannedAt?: Date | null;
  },
) {
  return prisma.library.update({
    where: { id },
    data,
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
