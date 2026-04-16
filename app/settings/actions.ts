"use server";

import { revalidatePath } from "next/cache";
import {
  createTagRule,
  deleteTagRule,
  type TagRuleMatchMode,
  type TagRuleTarget,
  toggleTagRuleEnabled,
} from "@/lib/data/tag-rules";
import { assertAuthenticated } from "@/lib/server/auth";

export type TagRuleActionState = {
  success: boolean;
  error?: string;
  message?: string;
};

const initialState: TagRuleActionState = {
  success: false,
};

export async function createTagRuleAction(
  prevState: TagRuleActionState = initialState,
  formData: FormData,
): Promise<TagRuleActionState> {
  void prevState;
  await assertAuthenticated();

  const name = String(formData.get("name") ?? "").trim();
  const target = String(formData.get("target") ?? "").trim() as TagRuleTarget;
  const matchMode = String(formData.get("matchMode") ?? "").trim() as TagRuleMatchMode;
  const pattern = String(formData.get("pattern") ?? "").trim();
  const tagName = String(formData.get("tagName") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "true") === "true";

  if (!name || !pattern || !tagName) {
    return {
      success: false,
      error: "Name, pattern, and tag are required.",
    };
  }

  if (!["FILE_NAME", "FOLDER_PATH", "LIBRARY_NAME"].includes(target)) {
    return {
      success: false,
      error: "Choose a valid rule target.",
    };
  }

  if (!["CONTAINS", "EQUALS"].includes(matchMode)) {
    return {
      success: false,
      error: "Choose a valid match mode.",
    };
  }

  try {
    await createTagRule({
      name,
      target,
      matchMode,
      pattern,
      tagName,
      enabled,
    });
    revalidatePath("/settings");
    return {
      success: true,
      message: "Rule saved.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save the rule.",
    };
  }
}

export async function toggleTagRuleEnabledAction(formData: FormData) {
  await assertAuthenticated();
  const id = String(formData.get("id") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "").trim() === "true";

  if (!id) {
    return;
  }

  await toggleTagRuleEnabled(id, enabled);
  revalidatePath("/settings");
}

export async function deleteTagRuleAction(formData: FormData) {
  await assertAuthenticated();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return;
  }

  await deleteTagRule(id);
  revalidatePath("/settings");
}
