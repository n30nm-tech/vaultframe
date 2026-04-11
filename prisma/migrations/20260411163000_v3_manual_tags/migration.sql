CREATE TABLE IF NOT EXISTS "Tag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");

CREATE TABLE IF NOT EXISTS "_MediaItemToTag" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_MediaItemToTag_AB_unique" ON "_MediaItemToTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_MediaItemToTag_B_index" ON "_MediaItemToTag"("B");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_MediaItemToTag_A_fkey'
  ) THEN
    ALTER TABLE "_MediaItemToTag"
      ADD CONSTRAINT "_MediaItemToTag_A_fkey"
      FOREIGN KEY ("A") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_MediaItemToTag_B_fkey'
  ) THEN
    ALTER TABLE "_MediaItemToTag"
      ADD CONSTRAINT "_MediaItemToTag_B_fkey"
      FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
