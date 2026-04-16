import { NextResponse } from "next/server";
import {
  createAuthenticatedSession,
  getSessionCookieName,
  getSessionCookieOptions,
  isAuthEnabled,
  storeNewPassword,
  verifyAppPassword,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const settingsUrl = new URL("/settings", request.url);
  const authAlreadyEnabled = await isAuthEnabled();

  if (authAlreadyEnabled && !(await verifyAppPassword(currentPassword))) {
    settingsUrl.searchParams.set("auth", "invalid-current");
    return NextResponse.redirect(settingsUrl, 303);
  }

  if (!newPassword.trim()) {
    settingsUrl.searchParams.set("auth", "empty-new");
    return NextResponse.redirect(settingsUrl, 303);
  }

  if (newPassword !== confirmPassword) {
    settingsUrl.searchParams.set("auth", "mismatch");
    return NextResponse.redirect(settingsUrl, 303);
  }

  await storeNewPassword(newPassword);

  settingsUrl.searchParams.set("auth", "changed");
  const response = NextResponse.redirect(settingsUrl, 303);
  response.cookies.set(
    getSessionCookieName(),
    await createAuthenticatedSession(),
    getSessionCookieOptions(),
  );
  return response;
}
