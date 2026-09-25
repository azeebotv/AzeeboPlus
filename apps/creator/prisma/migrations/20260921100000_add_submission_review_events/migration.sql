-- Submission detail view: append-only review history.
CREATE TABLE "challenge_submission_review_events" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_submission_review_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "challenge_submission_review_events_submissionId_idx"
    ON "challenge_submission_review_events"("submissionId");
