"use server";

import { updateAppPassword, verifyPassword } from "@/lib/server/auth";

export type ChangePasswordActionState = {
  success: boolean;
  error?: string;
  message?: string;
};

const initialState: ChangePasswordActionState = {
  success: false,
};

export async function changePasswordAction(
  prevState: ChangePasswordActionState = initialState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  void prevState;

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !nextPassword || !confirmPassword) {
    return {
      success: false,
      error: "Fill in all password fields.",
    };
  }

  if (!(await verifyPassword(currentPassword))) {
    return {
      success: false,
      error: "Current password is incorrect.",
    };
  }

  if (nextPassword !== confirmPassword) {
    return {
      success: false,
      error: "New password and confirmation do not match.",
    };
  }

  if (nextPassword.trim().length < 8) {
    return {
      success: false,
      error: "Use at least 8 characters for the new password.",
    };
  }

  await updateAppPassword(nextPassword);

  return {
    success: true,
    message: "Password updated. New logins will use it immediately.",
  };
}
