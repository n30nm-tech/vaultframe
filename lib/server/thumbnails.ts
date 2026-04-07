import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const APP_DATA_DIR = process.env.APP_DATA_DIR || "/app/data";
const THUMBNAILS_DIR = path.join(APP_DATA_DIR, "thumbnails");
const THUMBNAIL_ROUTE_PREFIX = "/api/thumbnails";

export async function ensureThumbnailForVideo(videoPath: string) {
  const thumbnailFileName = `${createHash("sha1").update(videoPath).digest("hex")}.jpg`;
  const thumbnailDiskPath = path.join(THUMBNAILS_DIR, thumbnailFileName);
  const thumbnailPublicPath = `${THUMBNAIL_ROUTE_PREFIX}/${thumbnailFileName}`;

  await mkdir(THUMBNAILS_DIR, { recursive: true });

  if (await fileExists(thumbnailDiskPath)) {
    return thumbnailPublicPath;
  }

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-ss",
      "00:00:03",
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      thumbnailDiskPath,
    ]);

    return (await fileExists(thumbnailDiskPath)) ? thumbnailPublicPath : null;
  } catch {
    return null;
  }
}

export function getThumbnailDiskPath(fileName: string) {
  return path.join(THUMBNAILS_DIR, fileName);
}

async function fileExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}
