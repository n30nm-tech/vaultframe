import { NextResponse } from "next/server";
import { cancelModelImport } from "@/lib/server/model-import";
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

    const result = await cancelModelImport(modelId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to cancel model import.",
      },
      { status: 400 },
    );
  }
}
