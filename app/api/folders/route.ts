import { NextResponse } from "next/server";
import { browseFolders, FolderBrowserError } from "@/lib/server/folder-browser";

export async function GET(request: Request) {
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
