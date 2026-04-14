import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { assertRequestAuthenticated } from "@/lib/server/auth";
import { getStoryboardDiskPath } from "@/lib/server/thumbnails";

type StoryboardRouteProps = {
  params: Promise<{
    fileName: string;
  }>;
};

export async function GET(request: Request, { params }: StoryboardRouteProps) {
  if (!(await assertRequestAuthenticated(request))) {
    return new NextResponse("Authentication required.", { status: 401 });
  }

  const { fileName } = await params;

  if (!/^[a-f0-9]+-\d+\.jpg$/i.test(fileName)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const diskPath = getStoryboardDiskPath(path.basename(fileName));

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
