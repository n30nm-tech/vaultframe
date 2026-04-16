import { NextResponse } from "next/server";
import {
  getExpiredSessionCookieOptions,
  getSessionCookieName,
} from "@/lib/server/auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(getSessionCookieName(), "", getExpiredSessionCookieOptions());
  return response;
}
