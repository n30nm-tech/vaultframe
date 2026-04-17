import { NextResponse } from "next/server";
import { mergeModels } from "@/lib/data/models";
import { isAuthenticated } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      sourceModelId?: string;
      targetModelId?: string;
    };
    const sourceModelId = String(payload.sourceModelId ?? "").trim();
    const targetModelId = String(payload.targetModelId ?? "").trim();

    if (!sourceModelId || !targetModelId) {
      return NextResponse.json({ ok: false, error: "Missing model ids." }, { status: 400 });
    }

    const result = await mergeModels(sourceModelId, targetModelId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to merge models.",
      },
      { status: 400 },
    );
  }
}
