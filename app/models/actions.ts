"use server";

import { revalidatePath } from "next/cache";
import { createModel, createModelsFromSubfolders, findModelByPath } from "@/lib/data/models";
import { assertAuthenticated } from "@/lib/server/auth";
import { FolderBrowserError, validateLibraryPath } from "@/lib/server/folder-browser";
import { enqueueModelImport, ensureModelImportRunnerStarted } from "@/lib/server/model-import";

export type ModelActionState = {
  success: boolean;
  error?: string;
  message?: string;
  duplicates?: string[];
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
  const importMode =
    String(formData.get("importMode") ?? "single") === "subfolders" ? "subfolders" : "single";
  const fields: ModelActionState["fields"] = {};

  if (!path) {
    fields.path = "Path is required.";
  }

  if (importMode === "single" && !name) {
    // Optional by design; keep accepted.
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
    const existingModel = await findModelByPath(path);

    if (importMode === "single" && existingModel) {
      return {
        success: false,
        error: "That folder is already saved as a model.",
        duplicates: [existingModel.path],
      };
    }

    ensureModelImportRunnerStarted();

    if (importMode === "subfolders") {
      const result = await createModelsFromSubfolders({ path, enabled });

      await Promise.all(result.createdModels.map((model) => enqueueModelImport(model.id)));
      revalidatePath("/models");

      if (result.createdCount === 0) {
        return {
          success: false,
          error: "No new model folders were created.",
          duplicates: result.skippedFolders.map((folder) => `${folder.path} (${folder.reason})`),
        };
      }

      const skippedSummary =
        result.skippedFolders.length > 0
          ? ` Skipped ${result.skippedFolders.length} folder${result.skippedFolders.length === 1 ? "" : "s"} that were already models or had no supported media.`
          : "";

      return {
        success: true,
        message: `Created ${result.createdCount} models from first-level subfolders.${skippedSummary}`,
        duplicates: result.skippedFolders.map((folder) => `${folder.path} (${folder.reason})`),
      };
    }

    const model = await createModel({ name, path, enabled });
    await enqueueModelImport(model.id);
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
