import { NextResponse } from "next/server";
import { deleteLibraries } from "@/lib/data/libraries";
import { isAuthenticated } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let ids: string[] = [];

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json()) as { ids?: unknown };
    ids = Array.isArray(payload.ids) ? payload.ids.map((value) => String(value).trim()) : [];
  } else {
    const formData = await request.formData();
    ids = formData.getAll("ids").map((value) => String(value).trim());
  }

  const normalizedIds = Array.from(new Set(ids.filter(Boolean)));

  if (normalizedIds.length === 0) {
    return NextResponse.json({ ok: false, error: "no-ids" }, { status: 400 });
  }

  const result = await deleteLibraries(normalizedIds);

  return NextResponse.json({
    ok: true,
    deletedCount: result.count,
  });
}
