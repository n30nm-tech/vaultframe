import { NextResponse } from "next/server";
import { assertRequestAuthenticated } from "@/lib/server/auth";
import { browseFolders, FolderBrowserError } from "@/lib/server/folder-browser";

export async function GET(request: Request) {
  if (!(await assertRequestAuthenticated(request))) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedPath = searchParams.get("path") ?? undefined;

  try {
    const payload = await browseFolders(requestedPath);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof FolderBrowserError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unable to browse folders right now." },
      { status: 500 },
    );
  }
}
