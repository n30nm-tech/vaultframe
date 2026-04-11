import { Film, FolderTree } from "lucide-react";
import { listLibraries } from "@/lib/data/libraries";
import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [libraries, totalMediaItems, missingMediaItems, recentMediaItems] = await Promise.all([
    listLibraries(),
    prisma.mediaItem.count(),
    prisma.mediaItem.count({
      where: {
        missing: true,
      },
    }),
    prisma.mediaItem.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        title: true,
        fileName: true,
        missing: true,
        thumbnailPath: true,
        updatedAt: true,
        library: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const enabledLibraries = libraries.filter((library) => library.enabled);
  const runningLibraries = libraries.filter((library) => library.scanStatus === "RUNNING");
  const queuedLibraries = libraries.filter((library) => library.scanStatus === "QUEUED");
  const failedLibraries = libraries.filter((library) => library.scanStatus === "FAILED");
  const offlineLibraries = libraries.filter((library) => !library.storageAvailable);
  const recentlyScannedLibraries = [...libraries]
    .filter((library) => library.lastScannedAt)
    .sort((left, right) => {
      return (
        new Date(right.lastScannedAt ?? 0).getTime() -
        new Date(left.lastScannedAt ?? 0).getTime()
      );
    })
    .slice(0, 5);

  return {
    stats: [
      {
        title: "Libraries",
        value: String(libraries.length),
        detail: `${enabledLibraries.length} enabled`,
        icon: FolderTree,
      },
      {
        title: "Indexed media",
        value: totalMediaItems.toLocaleString("en-GB"),
        detail: `${Math.max(totalMediaItems - missingMediaItems, 0).toLocaleString("en-GB")} available`,
        icon: Film,
      },
      {
        title: "Scan queue",
        value: String(runningLibraries.length + queuedLibraries.length),
        detail:
          runningLibraries.length > 0
            ? `${runningLibraries.length} running, ${queuedLibraries.length} queued`
            : queuedLibraries.length > 0
              ? `${queuedLibraries.length} queued`
              : "No active scans",
        icon: FolderTree,
      },
      {
        title: "Attention needed",
        value: String(offlineLibraries.length + failedLibraries.length + missingMediaItems),
        detail: `${offlineLibraries.length} offline, ${failedLibraries.length} failed scans, ${missingMediaItems} missing items`,
        icon: Film,
      },
    ],
    runningLibraries,
    queuedLibraries,
    offlineLibraries,
    failedLibraries,
    recentlyScannedLibraries,
    recentMediaItems,
  };
}
