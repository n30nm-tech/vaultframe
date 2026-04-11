CREATE TABLE IF NOT EXISTS "TagRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "matchMode" TEXT NOT NULL DEFAULT 'CONTAINS',
  "pattern" TEXT NOT NULL,
  "tagName" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TagRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TagRule_enabled_idx" ON "TagRule"("enabled");
