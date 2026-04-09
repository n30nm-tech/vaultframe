import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const APP_DATA_DIR = process.env.APP_DATA_DIR || "/app/data";
const THUMBNAILS_DIR = path.join(APP_DATA_DIR, "thumbnails");
const STORYBOARDS_DIR = path.join(APP_DATA_DIR, "storyboards");
const THUMBNAIL_ROUTE_PREFIX = "/api/thumbnails";
const STORYBOARD_ROUTE_PREFIX = "/api/storyboards";
const STORYBOARD_FRAME_COUNT = 10;

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

export async function ensureStoryboardForVideo(videoPath: string) {
  const hash = createHash("sha1").update(videoPath).digest("hex");

  await mkdir(STORYBOARDS_DIR, { recursive: true });

  const existingPaths = await Promise.all(
    Array.from({ length: STORYBOARD_FRAME_COUNT }, async (_, index) => {
      const fileName = `${hash}-${index + 1}.jpg`;
      const diskPath = path.join(STORYBOARDS_DIR, fileName);

      return (await fileExists(diskPath)) ? `${STORYBOARD_ROUTE_PREFIX}/${fileName}` : null;
    }),
  );

  if (existingPaths.every(Boolean)) {
    return existingPaths.filter((item): item is string => Boolean(item));
  }

  try {
    await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ]);
  } catch {
    return [];
  }

  const duration = await readVideoDuration(videoPath);

  if (!duration || duration <= 0) {
    return [];
  }

  const timestamps = buildStoryboardTimestamps(duration, STORYBOARD_FRAME_COUNT);
  const generatedPaths: string[] = [];

  for (const [index, timestamp] of timestamps.entries()) {
    const fileName = `${hash}-${index + 1}.jpg`;
    const diskPath = path.join(STORYBOARDS_DIR, fileName);
    const publicPath = `${STORYBOARD_ROUTE_PREFIX}/${fileName}`;

    if (await fileExists(diskPath)) {
      generatedPaths.push(publicPath);
      continue;
    }

    try {
      await execFileAsync("ffmpeg", [
        "-y",
        "-ss",
        timestamp.toFixed(2),
        "-i",
        videoPath,
        "-frames:v",
        "1",
        "-vf",
        "scale=640:-1",
        "-q:v",
        "4",
        diskPath,
      ]);

      if (await fileExists(diskPath)) {
        generatedPaths.push(publicPath);
      }
    } catch {
      continue;
    }
  }

  return generatedPaths;
}

export function getThumbnailDiskPath(fileName: string) {
  return path.join(THUMBNAILS_DIR, fileName);
}

export function getStoryboardDiskPath(fileName: string) {
  return path.join(STORYBOARDS_DIR, fileName);
}

async function readVideoDuration(videoPath: string) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ]);

    const duration = Number.parseFloat(stdout.trim());
    return Number.isFinite(duration) ? duration : null;
  } catch {
    return null;
  }
}

function buildStoryboardTimestamps(durationSeconds: number, frameCount: number) {
  const usableDuration = Math.max(durationSeconds - 4, 1);
  const startOffset = Math.min(3, usableDuration * 0.1);
  const endOffset = Math.min(1, usableDuration * 0.05);
  const span = Math.max(usableDuration - startOffset - endOffset, 1);

  return Array.from({ length: frameCount }, (_, index) => {
    const position = (index + 0.5) / frameCount;
    return startOffset + span * position;
  });
}

async function fileExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}
