"use server";

import { revalidatePath } from "next/cache";
import {
  createLibrary,
  createLibrariesFromSubfolders,
  deleteLibrary,
  toggleLibraryEnabled,
  updateLibrary,
} from "@/lib/data/libraries";
import { FolderBrowserError, validateLibraryPath } from "@/lib/server/folder-browser";
import {
  enqueueLibraryScan,
  getLibraryScanAvailability,
  isFolderBrowserError,
} from "@/lib/server/library-scan";
import { assertAuthenticated } from "@/lib/server/auth";

export type LibraryActionState = {
  success: boolean;
  error?: string;
  message?: string;
  duplicates?: string[];
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
        importMode: "single" | "subfolders";
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
  await assertAuthenticated();
  const parsed = parseLibraryFormData(formData);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    await validateLibraryPath(parsed.values.path);
    if (parsed.values.importMode === "subfolders") {
      const result = await createLibrariesFromSubfolders(parsed.values);
      revalidatePath("/libraries");

      if (result.createdCount === 0 && result.skippedCount > 0) {
        return {
          success: false,
          error: "Those folders are already saved as libraries.",
          duplicates: result.skippedFolders.map((folder) => folder.path),
        };
      }

      const duplicateLabel =
        result.skippedCount > 0
          ? ` Skipped ${result.skippedCount} folder${result.skippedCount === 1 ? "" : "s"} already in the library list.`
          : "";

      return {
        success: true,
        message: `Created ${result.createdCount} libraries from subfolders.${duplicateLabel}`,
        duplicates: result.skippedFolders.map((folder) => folder.path),
      };
    }

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
  await assertAuthenticated();
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
  await assertAuthenticated();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return;
  }

  await deleteLibrary(id);
  revalidatePath("/libraries");
}

export async function toggleLibraryEnabledAction(formData: FormData) {
  await assertAuthenticated();
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
  await assertAuthenticated();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return {
      success: false,
      error: "Library id is missing.",
    };
  }

  try {
    await getLibraryScanAvailability(id);
    const result = await enqueueLibraryScan(id);
    revalidatePath("/libraries");

    return {
      success: true,
      message: result.message,
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
  const importMode =
    String(formData.get("importMode") ?? "single") === "subfolders" ? "subfolders" : "single";

  const fields: LibraryActionState["fields"] = {};

  if (importMode === "single" && !name) {
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
      importMode,
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
