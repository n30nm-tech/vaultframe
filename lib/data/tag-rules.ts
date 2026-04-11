import { prisma } from "@/lib/prisma";

export type TagRuleTarget = "FILE_NAME" | "FOLDER_PATH" | "LIBRARY_NAME";
export type TagRuleMatchMode = "CONTAINS" | "EQUALS";

export type TagRuleRecord = {
  id: string;
  name: string;
  target: TagRuleTarget;
  matchMode: TagRuleMatchMode;
  pattern: string;
  tagName: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function listTagRules(): Promise<TagRuleRecord[]> {
  return (await (prisma as typeof prisma & {
    tagRule: {
      findMany: (args: unknown) => Promise<TagRuleRecord[]>;
    };
  }).tagRule.findMany({
    orderBy: [{ enabled: "desc" }, { createdAt: "desc" }],
  })) as TagRuleRecord[];
}

export async function listEnabledTagRules(): Promise<TagRuleRecord[]> {
  return (await (prisma as typeof prisma & {
    tagRule: {
      findMany: (args: unknown) => Promise<TagRuleRecord[]>;
    };
  }).tagRule.findMany({
    where: {
      enabled: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })) as TagRuleRecord[];
}

export async function createTagRule(values: {
  name: string;
  target: TagRuleTarget;
  matchMode: TagRuleMatchMode;
  pattern: string;
  tagName: string;
  enabled: boolean;
}) {
  return (prisma as typeof prisma & {
    tagRule: {
      create: (args: unknown) => Promise<TagRuleRecord>;
    };
  }).tagRule.create({
    data: values,
  });
}

export async function toggleTagRuleEnabled(id: string, enabled: boolean) {
  return (prisma as typeof prisma & {
    tagRule: {
      update: (args: unknown) => Promise<TagRuleRecord>;
    };
  }).tagRule.update({
    where: { id },
    data: { enabled },
  });
}

export async function deleteTagRule(id: string) {
  return (prisma as typeof prisma & {
    tagRule: {
      delete: (args: unknown) => Promise<TagRuleRecord>;
    };
  }).tagRule.delete({
    where: { id },
  });
}
