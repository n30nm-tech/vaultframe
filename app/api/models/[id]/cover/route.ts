import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { setModelCoverAsset } from "@/lib/data/models";
import { buildExternalUrl, getExternalBaseUrl, isAuthenticated } from "@/lib/server/auth";

type ModelCoverRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: ModelCoverRouteProps) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const assetId = String(formData.get("assetId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const wantsJson =
    request.headers.get("accept")?.includes("application/json") ||
    new URL(request.url).searchParams.get("format") === "json";
  const fallbackUrl = buildExternalUrl(request, `/models/${id}`);
  const externalBaseUrl = getExternalBaseUrl(request);

  const redirectTo = (() => {
    if (!returnTo) {
      return fallbackUrl;
    }

    try {
      const candidate = new URL(returnTo, externalBaseUrl);

      if (candidate.origin !== fallbackUrl.origin) {
        return fallbackUrl;
      }

      return candidate;
    } catch {
      return fallbackUrl;
    }
  })();

  if (!assetId) {
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: "missing-asset" }, { status: 400 });
    }

    return NextResponse.redirect(redirectTo, 303);
  }

  try {
    await setModelCoverAsset(id, assetId);
    revalidatePath("/models");
    revalidatePath(`/models/${id}`);

    if (wantsJson) {
      return NextResponse.json({
        ok: true,
        modelId: id,
        coverAssetId: assetId,
      });
    }

    return NextResponse.redirect(redirectTo, 303);
  } catch (error) {
    if (wantsJson) {
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Unable to update model cover.",
        },
        { status: 400 },
      );
    }

    return NextResponse.redirect(fallbackUrl, 303);
  }
}
