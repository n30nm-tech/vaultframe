"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addExistingTagToMediaItem, removeTagFromMediaItem } from "@/lib/data/tags";
import { assertAuthenticated } from "@/lib/server/auth";

export type MediaTagActionState = {
  success: boolean;
  error?: string;
  message?: string;
};

export type MediaPosterActionState = {
  success: boolean;
  error?: string;
  message?: string;
};

const initialState: MediaTagActionState = {
  success: false,
};

const initialPosterState: MediaPosterActionState = {
  success: false,
};

export async function addMediaTagAction(
  prevState: MediaTagActionState = initialState,
  formData: FormData,
): Promise<MediaTagActionState> {
  void prevState;
  await assertAuthenticated();

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
  await assertAuthenticated();
  const mediaItemId = String(formData.get("mediaItemId") ?? "").trim();
  const tagId = String(formData.get("tagId") ?? "").trim();

  if (!mediaItemId || !tagId) {
    return;
  }

  await removeTagFromMediaItem(mediaItemId, tagId);
  revalidatePath(`/media/${mediaItemId}`);
  revalidatePath("/media");
}

export async function setMediaPosterFromStoryboardAction(
  prevState: MediaPosterActionState = initialPosterState,
  formData: FormData,
): Promise<MediaPosterActionState> {
  void prevState;
  await assertAuthenticated();

  const mediaItemId = String(formData.get("mediaItemId") ?? "").trim();
  const storyboardPath = String(formData.get("storyboardPath") ?? "").trim();

  if (!mediaItemId) {
    return {
      success: false,
      error: "Media item is missing.",
    };
  }

  if (!storyboardPath) {
    return {
      success: false,
      error: "Storyboard frame is missing.",
    };
  }

  const mediaItem = await prisma.mediaItem.findUnique({
    where: { id: mediaItemId },
    select: {
      id: true,
      storyboardPaths: true,
    },
  });

  if (!mediaItem) {
    return {
      success: false,
      error: "Media item not found.",
    };
  }

  if (!mediaItem.storyboardPaths.includes(storyboardPath)) {
    return {
      success: false,
      error: "That storyboard frame does not belong to this video.",
    };
  }

  await prisma.mediaItem.update({
    where: { id: mediaItemId },
    data: {
      thumbnailPath: storyboardPath,
    },
  });

  revalidatePath(`/media/${mediaItemId}`);
  revalidatePath("/media");

  return {
    success: true,
    message: "Poster updated from storyboard frame.",
  };
}

export async function setMediaPosterFromStoryboardFormAction(formData: FormData) {
  await setMediaPosterFromStoryboardAction(initialPosterState, formData);
}
