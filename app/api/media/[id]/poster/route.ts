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
  const wantsJson =
    request.headers.get("accept")?.includes("application/json") ||
    new URL(request.url).searchParams.get("format") === "json";
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
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: "missing-storyboard" }, { status: 400 });
    }
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
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: "missing-media" }, { status: 404 });
    }
    return NextResponse.redirect(fallbackUrl, 303);
  }

  if (!mediaItem.storyboardPaths.includes(storyboardPath)) {
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: "invalid-storyboard" }, { status: 400 });
    }
    return NextResponse.redirect(redirectTo, 303);
  }

  await prisma.mediaItem.update({
    where: { id },
    data: {
      thumbnailPath: storyboardPath,
      posterSelectionMode: "CUSTOM",
      posterReviewedAt: new Date(),
    },
  });

  revalidatePath(`/media/${id}`);
  revalidatePath("/media");
  revalidatePath("/media/posters");

  if (wantsJson) {
    return NextResponse.json({
      ok: true,
      mediaId: id,
      thumbnailPath: storyboardPath,
    });
  }

  return NextResponse.redirect(redirectTo, 303);
}
