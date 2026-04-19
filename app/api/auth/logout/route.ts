import { NextResponse } from "next/server";
import {
  buildExternalUrl,
  getExpiredSessionCookieOptions,
  getSessionCookieName,
} from "@/lib/server/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const reason = requestUrl.searchParams.get("reason")?.trim();
  const returnTo = requestUrl.searchParams.get("returnTo")?.trim();
  const loginUrl = buildExternalUrl(request, "/login");

  if (reason === "idle") {
    loginUrl.searchParams.set("locked", "idle");
  }

  if (returnTo?.startsWith("/")) {
    loginUrl.searchParams.set("returnTo", returnTo);
  }

  const response = NextResponse.redirect(loginUrl, 303);
  response.cookies.set(getSessionCookieName(), "", getExpiredSessionCookieOptions());
  return response;
}
