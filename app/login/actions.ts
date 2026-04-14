"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  getExpectedSessionToken,
  isAuthConfigured,
  verifyPassword,
} from "@/lib/server/auth";

export type LoginActionState = {
  success: boolean;
  error?: string;
};

const initialState: LoginActionState = {
  success: false,
};

export async function loginAction(
  prevState: LoginActionState = initialState,
  formData: FormData,
): Promise<LoginActionState> {
  void prevState;

  if (!isAuthConfigured()) {
    return {
      success: false,
      error: "APP_PASSWORD and APP_SESSION_SECRET must be set before login can be used.",
    };
  }

  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/");

  if (!(await verifyPassword(password))) {
    return {
      success: false,
      error: "Incorrect password.",
    };
  }

  const cookieStore = await cookies();
  const token = await getExpectedSessionToken();
  cookieStore.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(nextPath.startsWith("/") ? nextPath : "/");
}
