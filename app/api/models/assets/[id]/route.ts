import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getModelAssetById, validateModelAssetStreamPath } from "@/lib/data/models";
import { isAuthenticated } from "@/lib/server/auth";
import { FolderBrowserError } from "@/lib/server/folder-browser";

type ModelAssetRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".wmv": "video/x-ms-wmv",
  ".webm": "video/webm",
  ".m4v": "video/x-m4v",
  ".ts": "video/mp2t",
  ".m2ts": "video/mp2t",
  ".mts": "video/mp2t",
  ".mpg": "video/mpeg",
  ".mpeg": "video/mpeg",
  ".flv": "video/x-flv",
  ".3gp": "video/3gpp",
  ".ogv": "video/ogg",
};

export async function GET(request: Request, { params }: ModelAssetRouteProps) {
  if (!(await isAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const asset = await getModelAssetById(id);

  if (!asset || asset.missing) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const safePath = await validateModelAssetStreamPath(asset.fullPath, asset.model.path);
    const extension = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";
    const range = request.headers.get("range");

    if (!contentType.startsWith("video/")) {
      const data = await readFile(safePath);
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    const fileStats = await stat(safePath);
    const fileSize = fileStats.size;

    if (!range) {
      return new NextResponse(Readable.toWeb(createReadStream(safePath)) as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(fileSize),
          "Accept-Ranges": "bytes",
        },
      });
    }

    const matches = /bytes=(\d*)-(\d*)/.exec(range);

    if (!matches) {
      return new NextResponse("Invalid range", { status: 416 });
    }

    const start = matches[1] ? Number.parseInt(matches[1], 10) : 0;
    const end = matches[2] ? Number.parseInt(matches[2], 10) : fileSize - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
      return new NextResponse("Invalid range", { status: 416 });
    }

    return new NextResponse(
      Readable.toWeb(createReadStream(safePath, { start, end })) as BodyInit,
      {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
        },
      },
    );
  } catch (error) {
    if (error instanceof FolderBrowserError) {
      return new NextResponse(error.message, { status: error.status });
    }

    return new NextResponse("Unable to stream model asset.", { status: 500 });
  }
}
