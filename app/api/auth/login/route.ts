import { NextResponse } from "next/server";
import {
  buildExternalUrl,
  createAuthenticatedSession,
  getSessionCookieName,
  getSessionCookieOptions,
  verifyAppPassword,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  const fallbackUrl = buildExternalUrl(request, "/");

  const safeRedirect = (() => {
    if (!returnTo.startsWith("/")) {
      return fallbackUrl;
    }

    try {
      return buildExternalUrl(request, returnTo);
    } catch {
      return fallbackUrl;
    }
  })();

  if (!(await verifyAppPassword(password))) {
    return NextResponse.redirect(
      buildExternalUrl(
        request,
        `/login?error=invalid&returnTo=${encodeURIComponent(returnTo || "/")}`,
      ),
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
