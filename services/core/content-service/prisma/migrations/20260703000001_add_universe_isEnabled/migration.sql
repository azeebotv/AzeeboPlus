-- AlterTable: Add isEnabled to Universe
ALTER TABLE "universes" ADD COLUMN "isEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "universes_isEnabled_idx" ON "universes"("isEnabled");
