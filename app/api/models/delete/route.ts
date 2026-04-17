import { NextResponse } from "next/server";
import { deleteModel } from "@/lib/data/models";
import { isAuthenticated } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { id?: string };
    const id = String(payload.id ?? "").trim();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing model id." }, { status: 400 });
    }

    await deleteModel(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to delete model.",
      },
      { status: 500 },
    );
  }
}
