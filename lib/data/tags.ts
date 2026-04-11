import { prisma } from "@/lib/prisma";

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
