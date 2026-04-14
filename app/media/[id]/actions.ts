"use server";

import { revalidatePath } from "next/cache";
import { addExistingTagToMediaItem, removeTagFromMediaItem } from "@/lib/data/tags";

export type MediaTagActionState = {
  success: boolean;
  error?: string;
  message?: string;
};

const initialState: MediaTagActionState = {
  success: false,
};

export async function addMediaTagAction(
  prevState: MediaTagActionState = initialState,
  formData: FormData,
): Promise<MediaTagActionState> {
  void prevState;

  const mediaItemId = String(formData.get("mediaItemId") ?? "").trim();
  const tagId = String(formData.get("tagId") ?? "").trim();

  if (!mediaItemId) {
    return {
      success: false,
      error: "Media item is missing.",
    };
  }

  try {
    await addExistingTagToMediaItem(mediaItemId, tagId);
    revalidatePath(`/media/${mediaItemId}`);
    revalidatePath("/media");

    return {
      success: true,
      message: "Tag added.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to add tag.",
    };
  }
}

export async function removeMediaTagAction(formData: FormData) {
  const mediaItemId = String(formData.get("mediaItemId") ?? "").trim();
  const tagId = String(formData.get("tagId") ?? "").trim();

  if (!mediaItemId || !tagId) {
    return;
  }

  await removeTagFromMediaItem(mediaItemId, tagId);
  revalidatePath(`/media/${mediaItemId}`);
  revalidatePath("/media");
}
