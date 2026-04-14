import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getThumbnailDiskPath } from "@/lib/server/thumbnails";

type ThumbnailRouteProps = {
  params: Promise<{
    fileName: string;
  }>;
};

export async function GET(_request: Request, { params }: ThumbnailRouteProps) {
  const { fileName } = await params;

  if (!/^[a-f0-9]+\.jpg$/i.test(fileName)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const diskPath = getThumbnailDiskPath(path.basename(fileName));

  try {
    const data = await readFile(diskPath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
