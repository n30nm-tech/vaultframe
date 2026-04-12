import { getDirectoryAvailability } from "@/lib/server/folder-browser";

type StorageEntry = {
  id: string;
  path: string;
};

export async function getStorageAvailabilityMap<T extends StorageEntry>(entries: T[]) {
  const uniquePaths = Array.from(new Set(entries.map((entry) => entry.path)));
  const availabilityByPath = new Map(
    await Promise.all(
      uniquePaths.map(async (entryPath) => [entryPath, await getDirectoryAvailability(entryPath)] as const),
    ),
  );

  return new Map(
    entries.map((entry) => [
      entry.id,
      availabilityByPath.get(entry.path) ?? {
        available: false,
        message: "The library folder is currently unavailable.",
      },
    ]),
  );
}
