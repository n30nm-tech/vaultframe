import { prisma } from "@/lib/prisma";

export async function listTags() {
  const prismaWithTag = prisma as typeof prisma & {
    tag: {
      findMany: (args: unknown) => Promise<Array<{ id: string; name: string }>>;
      findUnique: (args: unknown) => Promise<{ id: string; name: string } | null>;
      upsert: (args: unknown) => Promise<{ id: string; name: string }>;
    };
  };

  return prismaWithTag.tag.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function addTagToMediaItem(mediaItemId: string, rawTagName: string) {
  const tagName = normalizeTagName(rawTagName);

  if (!tagName) {
    throw new Error("Enter a tag name.");
  }

  const prismaWithTag = prisma as typeof prisma & {
    tag: {
      upsert: (args: unknown) => Promise<{ id: string; name: string }>;
    };
  };

  const tag = await prismaWithTag.tag.upsert({
    where: {
      name: tagName,
    },
    create: {
      name: tagName,
    },
    update: {},
  });

  await prisma.mediaItem.update({
    where: {
      id: mediaItemId,
    },
    data: {
      tags: {
        connect: {
          id: tag.id,
        },
      },
    } as never,
  });
}

export async function addExistingTagToMediaItem(mediaItemId: string, tagId: string) {
  const trimmedTagId = tagId.trim();

  if (!trimmedTagId) {
    throw new Error("Choose a saved tag.");
  }

  const prismaWithTag = prisma as typeof prisma & {
    tag: {
      findUnique: (args: unknown) => Promise<{ id: string; name: string } | null>;
    };
  };

  const tag = await prismaWithTag.tag.findUnique({
    where: {
      id: trimmedTagId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!tag) {
    throw new Error("The selected tag no longer exists.");
  }

  await prisma.mediaItem.update({
    where: {
      id: mediaItemId,
    },
    data: {
      tags: {
        connect: {
          id: tag.id,
        },
      },
    } as never,
  });
}

export async function removeTagFromMediaItem(mediaItemId: string, tagId: string) {
  await prisma.mediaItem.update({
    where: {
      id: mediaItemId,
    },
    data: {
      tags: {
        disconnect: {
          id: tagId,
        },
      },
    } as never,
  });
}

function normalizeTagName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
