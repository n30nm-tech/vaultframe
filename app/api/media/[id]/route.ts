import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getMediaItemById } from "@/lib/data/media";
import { assertRequestAuthenticated } from "@/lib/server/auth";
import { FolderBrowserError, validateMediaFilePath } from "@/lib/server/folder-browser";

type MediaRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".wmv": "video/x-ms-wmv",
  ".webm": "video/webm",
  ".m4v": "video/x-m4v",
};

export async function GET(request: Request, { params }: MediaRouteProps) {
  if (!(await assertRequestAuthenticated(request))) {
    return new NextResponse("Authentication required.", { status: 401 });
  }

  const { id } = await params;
  const mediaItem = await getMediaItemById(id);

  if (!mediaItem || mediaItem.missing) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const safePath = await validateMediaFilePath(mediaItem.fullPath, mediaItem.library.path);
    const fileStats = await stat(safePath);
    const fileSize = fileStats.size;
    const range = request.headers.get("range");
    const contentType = MIME_TYPES[path.extname(safePath).toLowerCase()] || "application/octet-stream";

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

    return new NextResponse("Unable to stream media.", { status: 500 });
  }
}
