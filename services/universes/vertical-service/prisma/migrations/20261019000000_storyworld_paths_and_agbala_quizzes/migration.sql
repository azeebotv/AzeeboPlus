-- StoryworldPath and AgbalaQuiz were added to schema.prisma without a
-- migration (in-flight work committed as-is). This replays exactly what
-- prisma migrate diff derives so fresh deploys create the tables.
-- CreateTable
CREATE TABLE "storyworld_paths" (
    "id" TEXT NOT NULL,
    "storyworldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "totalSteps" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storyworld_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agbala_quizzes" (
    "id" TEXT NOT NULL,
    "storyworldId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agbala_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storyworld_paths_storyworldId_idx" ON "storyworld_paths"("storyworldId");

-- CreateIndex
CREATE INDEX "storyworld_paths_sortOrder_idx" ON "storyworld_paths"("sortOrder");

-- CreateIndex
CREATE INDEX "agbala_quizzes_storyworldId_idx" ON "agbala_quizzes"("storyworldId");

-- AddForeignKey
ALTER TABLE "storyworld_paths" ADD CONSTRAINT "storyworld_paths_storyworldId_fkey" FOREIGN KEY ("storyworldId") REFERENCES "universe_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agbala_quizzes" ADD CONSTRAINT "agbala_quizzes_storyworldId_fkey" FOREIGN KEY ("storyworldId") REFERENCES "universe_maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

