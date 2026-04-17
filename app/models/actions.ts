"use server";

import { revalidatePath } from "next/cache";
import { createModel } from "@/lib/data/models";
import { assertAuthenticated } from "@/lib/server/auth";
import { FolderBrowserError, validateLibraryPath } from "@/lib/server/folder-browser";

export type ModelActionState = {
  success: boolean;
  error?: string;
  fields?: {
    name?: string;
    path?: string;
  };
};

const initialState: ModelActionState = {
  success: false,
};

export async function createModelAction(
  prevState: ModelActionState = initialState,
  formData: FormData,
): Promise<ModelActionState> {
  void prevState;
  await assertAuthenticated();
  const name = String(formData.get("name") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "true") === "true";
  const fields: ModelActionState["fields"] = {};

  if (!path) {
    fields.path = "Path is required.";
  }

  if (fields.path) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fields,
    };
  }

  try {
    await validateLibraryPath(path);
    await createModel({ name, path, enabled });
    revalidatePath("/models");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof FolderBrowserError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
