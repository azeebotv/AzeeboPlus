-- Rights & governance tables backing the admin panel pages added with
-- AZP-RIGHTS-003/004/005 and TAA §55 dual-control.

-- AI-generated content provenance: which tool/model produced an asset,
-- attribution requirements, and the clearance decision.
CREATE TABLE "ai_provenance_records" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "aiTool" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL,
    "generationType" TEXT NOT NULL,
    "attributionRequired" BOOLEAN NOT NULL DEFAULT true,
    "talentRestriction" BOOLEAN NOT NULL DEFAULT false,
    "voiceRestriction" BOOLEAN NOT NULL DEFAULT false,
    "likenessRestriction" BOOLEAN NOT NULL DEFAULT false,
    "vendorIndependenceVerified" BOOLEAN NOT NULL DEFAULT false,
    "clearanceStatus" TEXT NOT NULL DEFAULT 'pending',
    "clearanceNotes" TEXT NOT NULL DEFAULT '',
    "clearedBy" TEXT,
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provenance_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ai_provenance_records_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ai_provenance_records_contentId_idx" ON "ai_provenance_records"("contentId");
CREATE INDEX "ai_provenance_records_clearanceStatus_idx" ON "ai_provenance_records"("clearanceStatus");

-- Two-person-integrity requests for high-risk operations. Two distinct admins
-- must approve before execution; self-approval is blocked at the service layer.
CREATE TABLE "dual_control_requests" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "amount" DECIMAL(65,30),
    "currency" TEXT,
    "targetUserIds" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "firstApprover" TEXT,
    "firstApprovedAt" TIMESTAMP(3),
    "secondApprover" TEXT,
    "secondApprovedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dual_control_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dual_control_requests_status_idx" ON "dual_control_requests"("status");

-- Talent, music, likeness, and voice clearances with territorial scope.
CREATE TABLE "rights_clearances" (
    "id" TEXT NOT NULL,
    "talentName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "universe" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiryDate" TIMESTAMP(3),
    "clearanceScope" TEXT NOT NULL DEFAULT 'worldwide',
    "regions" JSONB,
    "notes" TEXT NOT NULL DEFAULT '',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rights_clearances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rights_clearances_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "rights_clearances_status_idx" ON "rights_clearances"("status");
CREATE INDEX "rights_clearances_type_idx" ON "rights_clearances"("type");
CREATE INDEX "rights_clearances_contentId_idx" ON "rights_clearances"("contentId");
