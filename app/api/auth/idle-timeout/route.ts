import { NextResponse } from "next/server";
import { buildExternalUrl, isAuthenticated, storeAuthSettings } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.redirect(buildExternalUrl(request, "/login"), 303);
  }

  const formData = await request.formData();
  const rawValue = String(formData.get("idleTimeoutMinutes") ?? "disabled").trim();
  const settingsUrl = buildExternalUrl(request, "/settings");

  if (rawValue === "disabled") {
    await storeAuthSettings({ idleTimeoutMinutes: null });
    settingsUrl.searchParams.set("auth", "idle-saved");
    return NextResponse.redirect(settingsUrl, 303);
  }

  const idleTimeoutMinutes = Number(rawValue);

  if (!Number.isFinite(idleTimeoutMinutes) || idleTimeoutMinutes <= 0) {
    settingsUrl.searchParams.set("auth", "idle-invalid");
    return NextResponse.redirect(settingsUrl, 303);
  }

  await storeAuthSettings({ idleTimeoutMinutes });
  settingsUrl.searchParams.set("auth", "idle-saved");
  return NextResponse.redirect(settingsUrl, 303);
}
