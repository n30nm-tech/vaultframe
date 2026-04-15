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
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const fallbackUrl = new URL("/media", request.url);

  const redirectTo = (() => {
    if (!returnTo) {
      return fallbackUrl;
    }

    try {
      const candidate = new URL(returnTo, request.url);

      if (candidate.origin !== fallbackUrl.origin) {
        return fallbackUrl;
      }

      return candidate;
    } catch {
      return fallbackUrl;
    }
  })();

  if (!storyboardPath) {
    return NextResponse.redirect(redirectTo, 303);
  }

  const mediaItem = await prisma.mediaItem.findUnique({
    where: { id },
    select: {
      id: true,
      storyboardPaths: true,
    },
  });

  if (!mediaItem) {
    return NextResponse.redirect(fallbackUrl, 303);
  }

  if (!mediaItem.storyboardPaths.includes(storyboardPath)) {
    return NextResponse.redirect(redirectTo, 303);
  }

  await prisma.mediaItem.update({
    where: { id },
    data: {
      thumbnailPath: storyboardPath,
    },
  });

  revalidatePath(`/media/${id}`);
  revalidatePath("/media");

  return NextResponse.redirect(redirectTo, 303);
}
