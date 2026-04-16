import { NextResponse } from "next/server";
import {
  buildExternalUrl,
  getExpiredSessionCookieOptions,
  getSessionCookieName,
} from "@/lib/server/auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(buildExternalUrl(request, "/login"), 303);
  response.cookies.set(getSessionCookieName(), "", getExpiredSessionCookieOptions());
  return response;
}
