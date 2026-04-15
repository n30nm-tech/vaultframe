import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type MediaPosterRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: MediaPosterRouteProps) {
  const { id } = await params;
  const formData = await request.formData();
  const storyboardPath = String(formData.get("storyboardPath") ?? "").trim();

  if (!storyboardPath) {
    return NextResponse.redirect(new URL(`/media/${id}?poster=missing`, request.url));
  }

  const mediaItem = await prisma.mediaItem.findUnique({
    where: { id },
    select: {
      id: true,
      storyboardPaths: true,
    },
  });

  if (!mediaItem) {
    return NextResponse.redirect(new URL("/media", request.url));
  }

  if (!mediaItem.storyboardPaths.includes(storyboardPath)) {
    return NextResponse.redirect(new URL(`/media/${id}?poster=invalid`, request.url));
  }

  await prisma.mediaItem.update({
    where: { id },
    data: {
      thumbnailPath: storyboardPath,
    },
  });

  revalidatePath(`/media/${id}`);
  revalidatePath("/media");

  return NextResponse.redirect(new URL(`/media/${id}?poster=updated`, request.url));
}
