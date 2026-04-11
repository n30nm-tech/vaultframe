"use server";

import { revalidatePath } from "next/cache";
import {
  createLibrary,
  deleteLibrary,
  toggleLibraryEnabled,
  updateLibrary,
} from "@/lib/data/libraries";
import { FolderBrowserError, validateLibraryPath } from "@/lib/server/folder-browser";
import {
  getLibraryScanAvailability,
  isFolderBrowserError,
  startLibraryScanInBackground,
} from "@/lib/server/library-scan";

export type LibraryActionState = {
  success: boolean;
  error?: string;
  message?: string;
  fields?: {
    name?: string;
    path?: string;
  };
};

type ParsedLibraryFormData =
  | {
      values: {
        name: string;
        path: string;
        enabled: boolean;
      };
    }
  | {
      error: LibraryActionState;
    };

const initialState: LibraryActionState = {
  success: false,
};

export async function createLibraryAction(
  prevState: LibraryActionState = initialState,
  formData: FormData,
): Promise<LibraryActionState> {
  void prevState;
  const parsed = parseLibraryFormData(formData);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    await validateLibraryPath(parsed.values.path);
    await createLibrary(parsed.values);
    revalidatePath("/libraries");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function updateLibraryAction(
  prevState: LibraryActionState = initialState,
  formData: FormData,
): Promise<LibraryActionState> {
  void prevState;
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return {
      success: false,
      error: "Library id is missing.",
    };
  }

  const parsed = parseLibraryFormData(formData);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    await validateLibraryPath(parsed.values.path);
    await updateLibrary(id, parsed.values);
    revalidatePath("/libraries");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function deleteLibraryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return;
  }

  await deleteLibrary(id);
  revalidatePath("/libraries");
}

export async function toggleLibraryEnabledAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "").trim() === "true";

  if (!id) {
    return;
  }

  await toggleLibraryEnabled(id, enabled);
  revalidatePath("/libraries");
}

export async function scanLibraryAction(
  prevState: LibraryActionState = initialState,
  formData: FormData,
): Promise<LibraryActionState> {
  void prevState;
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return {
      success: false,
      error: "Library id is missing.",
    };
  }

  try {
    await getLibraryScanAvailability(id);
    startLibraryScanInBackground(id);
    revalidatePath("/libraries");

    return {
      success: true,
      message: "Scan started. You can keep using the app while progress updates here.",
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

function parseLibraryFormData(formData: FormData): ParsedLibraryFormData {
  const name = String(formData.get("name") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "true") === "true";

  const fields: LibraryActionState["fields"] = {};

  if (!name) {
    fields.name = "Name is required.";
  }

  if (!path) {
    fields.path = "Path is required.";
  }

  if (fields.name || fields.path) {
    return {
      error: {
        success: false,
        error: "Please fix the highlighted fields.",
        fields,
      },
    };
  }

  return {
    values: {
      name,
      path,
      enabled,
    },
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof FolderBrowserError) {
    return error.message;
  }

  if (isFolderBrowserError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
