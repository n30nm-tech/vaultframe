import { NextResponse } from "next/server";
import { enqueueModelImport, ensureModelImportRunnerStarted } from "@/lib/server/model-import";
import { isAuthenticated } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      modelId?: string;
    };
    const modelId = String(payload.modelId ?? "").trim();

    if (!modelId) {
      return NextResponse.json({ ok: false, error: "Missing model id." }, { status: 400 });
    }

    ensureModelImportRunnerStarted();
    await enqueueModelImport(modelId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to queue model import.",
      },
      { status: 400 },
    );
  }
}
