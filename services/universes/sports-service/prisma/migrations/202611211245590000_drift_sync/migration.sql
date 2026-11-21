-- CreateTable
CREATE TABLE "sports_players" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "gridX" INTEGER NOT NULL DEFAULT 50,
    "gridY" INTEGER NOT NULL DEFAULT 50,
    "rating" DECIMAL(3,1),
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sports_players_teamId_idx" ON "sports_players"("teamId");

-- AddForeignKey
ALTER TABLE "sports_players" ADD CONSTRAINT "sports_players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "event_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

