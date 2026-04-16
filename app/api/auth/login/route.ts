import { NextResponse } from "next/server";
import {
  createAuthenticatedSession,
  getSessionCookieName,
  getSessionCookieOptions,
  verifyAppPassword,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const baseUrl = new URL(request.url);
  const fallbackUrl = new URL("/", baseUrl);

  const safeRedirect = (() => {
    if (!returnTo.startsWith("/")) {
      return fallbackUrl;
    }

    try {
      return new URL(returnTo, baseUrl);
    } catch {
      return fallbackUrl;
    }
  })();

  if (!(await verifyAppPassword(password))) {
    return NextResponse.redirect(
      new URL(`/login?error=invalid&returnTo=${encodeURIComponent(returnTo || "/")}`, baseUrl),
      303,
    );
  }

  const response = NextResponse.redirect(safeRedirect, 303);
  response.cookies.set(
    getSessionCookieName(),
    await createAuthenticatedSession(),
    getSessionCookieOptions(),
  );
  return response;
}
