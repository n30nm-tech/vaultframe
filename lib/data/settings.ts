import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { parseAllowedMediaRoots } from "@/lib/server/folder-browser";
import { getStorageAvailabilityMap } from "@/lib/server/storage-status";
import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

export async function getSettingsOverview() {
  const allowedRoots = parseAllowedMediaRoots();
  const [database, ffmpeg, ffprobe, rootStatuses] = await Promise.all([
    getDatabaseStatus(),
    getBinaryStatus("ffmpeg", ["-version"]),
    getBinaryStatus("ffprobe", ["-version"]),
    getStorageAvailabilityMap(
      allowedRoots.map((rootPath) => ({
        id: rootPath,
        path: rootPath,
      })),
    ),
  ]);

  return {
    appVersion: "v3.2",
    nodeEnv: process.env.NODE_ENV ?? "development",
    database,
    ffmpeg,
    ffprobe,
    allowedRoots: allowedRoots.map((rootPath) => ({
      path: rootPath,
      available: rootStatuses.get(rootPath)?.available ?? false,
      message: rootStatuses.get(rootPath)?.message ?? "The library folder is currently unavailable.",
    })),
    mediaDataPath: process.env.MEDIA_DATA_DIR ?? "/opt/vaultframe-data",
  };
}

async function getDatabaseStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      healthy: true,
      message: "Connected",
    };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : "Database unavailable",
    };
  }
}

async function getBinaryStatus(command: string, args: string[]) {
  try {
    await execFileAsync(command, args, { timeout: 5000 });

    return {
      available: true,
      message: "Detected",
    };
  } catch (error) {
    return {
      available: false,
      message: error instanceof Error ? error.message : `${command} unavailable`,
    };
  }
}
