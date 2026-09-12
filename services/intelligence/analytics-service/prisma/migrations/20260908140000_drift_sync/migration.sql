-- AlterTable
ALTER TABLE "conversion_metrics" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "event_schemas" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "experiment_events" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "session_summaries" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "universeId" TEXT NOT NULL,
    "universe" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "universe" TEXT NOT NULL DEFAULT 'unknown',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_events" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "platform" TEXT,
    "universe" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appVersion" TEXT,
    "experimentFlags" JSONB,
    "metadata" JSONB,

    CONSTRAINT "product_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_info" (
    "id" TEXT NOT NULL,
    "productEventId" TEXT NOT NULL,
    "deviceType" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "appVersion" TEXT,
    "screenWidth" INTEGER,
    "screenHeight" INTEGER,
    "language" TEXT,
    "timezone" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "device_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_steps" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "eventName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_completions" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedSteps" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_members" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audience_segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "segmentType" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_scores" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monetizationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churn_risks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "churnProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "factors" JSONB NOT NULL,
    "lastActivityAt" TIMESTAMP(3),
    "predictedChurnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "churn_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_detections" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_detections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdBy" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "dimensions" JSONB NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '[]',
    "dateField" TEXT NOT NULL DEFAULT 'createdAt',
    "dateRange" TEXT NOT NULL DEFAULT '30d',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "chartConfig" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_executions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "executedBy" TEXT NOT NULL,
    "executionTime" INTEGER NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "parameters" JSONB NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_registry" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "humanOwner" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "executionTier" TEXT NOT NULL DEFAULT 'T2',
    "riskLevel" TEXT NOT NULL DEFAULT 'R1',
    "autonomyLevel" TEXT NOT NULL DEFAULT 'A1',
    "killSwitchLevel" TEXT NOT NULL DEFAULT 'K0',
    "allowedTools" JSONB NOT NULL DEFAULT '[]',
    "deniedActions" JSONB NOT NULL DEFAULT '[]',
    "approvalActions" JSONB NOT NULL DEFAULT '[]',
    "dataClasses" JSONB NOT NULL DEFAULT '[]',
    "costBudgetDaily" DECIMAL(18,4),
    "costBudgetMonthly" DECIMAL(18,4),
    "modelTierDefault" TEXT,
    "modelTierFallback" TEXT,
    "qualityThreshold" JSONB,
    "valueKpis" JSONB,
    "slaTarget" JSONB,
    "metadata" JSONB,
    "workflowIds" JSONB NOT NULL DEFAULT '[]',
    "authorityRefs" JSONB NOT NULL DEFAULT '[]',
    "killSwitchPath" TEXT,
    "fallbackProcess" TEXT,
    "evaluationSuite" JSONB NOT NULL DEFAULT '[]',
    "lastHealthCheck" TIMESTAMP(3),
    "healthStatus" TEXT NOT NULL DEFAULT 'unknown',
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "totalErrors" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_evaluations" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "evaluationType" TEXT NOT NULL,
    "testSuite" TEXT NOT NULL,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "score" DECIMAL(5,2),
    "passedThreshold" BOOLEAN NOT NULL DEFAULT false,
    "failureDetails" JSONB,
    "environment" TEXT,
    "triggeredBy" TEXT,
    "metadata" JSONB,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_cost_events" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "requestId" TEXT,
    "model" TEXT NOT NULL,
    "modelTier" TEXT,
    "taskType" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(18,8) NOT NULL,
    "latencyMs" INTEGER,
    "userId" TEXT,
    "sessionId" TEXT,
    "domain" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_cost_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_kill_switches" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "rollbackData" JSONB,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_kill_switches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_classifications" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "reversibility" TEXT NOT NULL,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "approverRole" TEXT,
    "makerChecker" BOOLEAN NOT NULL DEFAULT false,
    "dataSensitivity" TEXT NOT NULL DEFAULT 'internal',
    "financialExposure" TEXT,
    "description" TEXT,
    "policyRef" TEXT,
    "maxAutoApproveUsd" DECIMAL(18,2),
    "escalationThreshold" TEXT,
    "requiredApproverCount" INTEGER NOT NULL DEFAULT 1,
    "cooldownMinutes" INTEGER,
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "correlationId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "requestContext" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decision" TEXT,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessment_logs" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "correlationId" TEXT,
    "inputContext" JSONB,
    "riskLevel" TEXT NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "reversibility" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decisionReason" TEXT NOT NULL,
    "approvalRequired" BOOLEAN NOT NULL,
    "approverRole" TEXT,
    "makerChecker" BOOLEAN NOT NULL,
    "dataSensitivity" TEXT NOT NULL,
    "financialExposure" TEXT,
    "estimatedCostUsd" DECIMAL(18,6),
    "approvalRequestId" TEXT,
    "overridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideBy" TEXT,
    "overrideReason" TEXT,
    "outcome" TEXT,
    "metadata" JSONB,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_assessment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_classifications" (
    "id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "workClass" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "complexityTier" TEXT NOT NULL,
    "requiredAgents" JSONB NOT NULL DEFAULT '[]',
    "requiredApprovals" JSONB NOT NULL DEFAULT '[]',
    "slaHours" INTEGER,
    "estimatedCostUsd" DECIMAL(18,4),
    "processStep" TEXT,
    "processOwner" TEXT,
    "volumePerWeek" INTEGER,
    "baselineMinutes" INTEGER,
    "description" TEXT,
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "inputPatterns" JSONB NOT NULL DEFAULT '[]',
    "outputPatterns" JSONB NOT NULL DEFAULT '[]',
    "dependencies" JSONB NOT NULL DEFAULT '[]',
    "triggersEvents" JSONB NOT NULL DEFAULT '[]',
    "reversible" TEXT NOT NULL DEFAULT 'reversible',
    "dataSensitivity" TEXT NOT NULL DEFAULT 'internal',
    "automationCandidate" BOOLEAN NOT NULL DEFAULT false,
    "eliminationCandidate" BOOLEAN NOT NULL DEFAULT false,
    "lastRoutedAt" TIMESTAMP(3),
    "totalRouted" INTEGER NOT NULL DEFAULT 0,
    "avgCostUsd" DECIMAL(18,6),
    "avgDurationMs" INTEGER,
    "successRate" DECIMAL(5,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_executions" (
    "id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "correlationId" TEXT,
    "workClass" TEXT NOT NULL,
    "executionChoice" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "priority" TEXT,
    "complexityTier" TEXT,
    "assignedAgent" TEXT,
    "assignedModel" TEXT,
    "modelTier" TEXT,
    "requiredApprovals" JSONB,
    "approvalStatus" TEXT,
    "approvedBy" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'routed',
    "success" BOOLEAN,
    "costUsd" DECIMAL(18,6),
    "tokensUsed" INTEGER,
    "errorType" TEXT,
    "errorMessage" TEXT,
    "humanEscalated" BOOLEAN NOT NULL DEFAULT false,
    "escalationReason" TEXT,
    "outputReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_ledger" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT,
    "taskType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "baselineHours" DECIMAL(10,2) NOT NULL,
    "postAgentHours" DECIMAL(10,2) NOT NULL,
    "hoursReleased" DECIMAL(10,2) NOT NULL,
    "redeploymentTarget" TEXT,
    "headcountAvoided" BOOLEAN NOT NULL DEFAULT false,
    "vendorAvoided" BOOLEAN NOT NULL DEFAULT false,
    "roleDescription" TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "period" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capacity_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_portfolio_reviews" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "reviewPeriod" TEXT NOT NULL,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5,2),
    "correctionRate" DECIMAL(5,2),
    "escalationRate" DECIMAL(5,2),
    "totalCostUsd" DECIMAL(18,4) NOT NULL,
    "valueScore" DECIMAL(5,2),
    "humanSupervisionHours" DECIMAL(10,2),
    "recommendation" TEXT,
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_portfolio_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "universes_name_key" ON "universes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_reference_key" ON "payment_intents"("reference");

-- CreateIndex
CREATE INDEX "payment_intents_userId_idx" ON "payment_intents"("userId");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");

-- CreateIndex
CREATE INDEX "watch_history_userId_idx" ON "watch_history"("userId");

-- CreateIndex
CREATE INDEX "watch_history_contentId_idx" ON "watch_history"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "reward_accounts_userId_key" ON "reward_accounts"("userId");

-- CreateIndex
CREATE INDEX "reward_accounts_userId_idx" ON "reward_accounts"("userId");

-- CreateIndex
CREATE INDEX "product_events_eventName_idx" ON "product_events"("eventName");

-- CreateIndex
CREATE INDEX "product_events_userId_idx" ON "product_events"("userId");

-- CreateIndex
CREATE INDEX "product_events_sessionId_idx" ON "product_events"("sessionId");

-- CreateIndex
CREATE INDEX "product_events_universe_idx" ON "product_events"("universe");

-- CreateIndex
CREATE INDEX "product_events_timestamp_idx" ON "product_events"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "device_info_productEventId_key" ON "device_info"("productEventId");

-- CreateIndex
CREATE INDEX "device_info_productEventId_idx" ON "device_info"("productEventId");

-- CreateIndex
CREATE UNIQUE INDEX "funnels_name_key" ON "funnels"("name");

-- CreateIndex
CREATE INDEX "funnel_steps_funnelId_idx" ON "funnel_steps"("funnelId");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_steps_funnelId_stepOrder_key" ON "funnel_steps"("funnelId", "stepOrder");

-- CreateIndex
CREATE INDEX "funnel_completions_funnelId_idx" ON "funnel_completions"("funnelId");

-- CreateIndex
CREATE INDEX "funnel_completions_userId_idx" ON "funnel_completions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_completions_funnelId_userId_key" ON "funnel_completions"("funnelId", "userId");

-- CreateIndex
CREATE INDEX "cohort_members_cohortId_idx" ON "cohort_members"("cohortId");

-- CreateIndex
CREATE INDEX "cohort_members_userId_idx" ON "cohort_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_members_cohortId_userId_key" ON "cohort_members"("cohortId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "creator_scores_creatorId_key" ON "creator_scores"("creatorId");

-- CreateIndex
CREATE INDEX "creator_scores_creatorId_idx" ON "creator_scores"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "churn_risks_userId_key" ON "churn_risks"("userId");

-- CreateIndex
CREATE INDEX "churn_risks_userId_idx" ON "churn_risks"("userId");

-- CreateIndex
CREATE INDEX "fraud_detections_status_idx" ON "fraud_detections"("status");

-- CreateIndex
CREATE INDEX "fraud_detections_userId_idx" ON "fraud_detections"("userId");

-- CreateIndex
CREATE INDEX "fraud_detections_reviewedBy_idx" ON "fraud_detections"("reviewedBy");

-- CreateIndex
CREATE INDEX "custom_reports_createdBy_idx" ON "custom_reports"("createdBy");

-- CreateIndex
CREATE INDEX "custom_reports_category_idx" ON "custom_reports"("category");

-- CreateIndex
CREATE INDEX "report_executions_reportId_idx" ON "report_executions"("reportId");

-- CreateIndex
CREATE INDEX "report_executions_executedBy_idx" ON "report_executions"("executedBy");

-- CreateIndex
CREATE INDEX "report_executions_executedAt_idx" ON "report_executions"("executedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_registry_agentId_key" ON "agent_registry"("agentId");

-- CreateIndex
CREATE INDEX "agent_registry_category_idx" ON "agent_registry"("category");

-- CreateIndex
CREATE INDEX "agent_registry_status_idx" ON "agent_registry"("status");

-- CreateIndex
CREATE INDEX "agent_registry_humanOwner_idx" ON "agent_registry"("humanOwner");

-- CreateIndex
CREATE INDEX "agent_registry_healthStatus_idx" ON "agent_registry"("healthStatus");

-- CreateIndex
CREATE INDEX "agent_evaluations_agentId_idx" ON "agent_evaluations"("agentId");

-- CreateIndex
CREATE INDEX "agent_evaluations_evaluationType_idx" ON "agent_evaluations"("evaluationType");

-- CreateIndex
CREATE INDEX "agent_evaluations_evaluatedAt_idx" ON "agent_evaluations"("evaluatedAt");

-- CreateIndex
CREATE INDEX "agent_evaluations_passedThreshold_idx" ON "agent_evaluations"("passedThreshold");

-- CreateIndex
CREATE INDEX "model_cost_events_agentId_idx" ON "model_cost_events"("agentId");

-- CreateIndex
CREATE INDEX "model_cost_events_model_idx" ON "model_cost_events"("model");

-- CreateIndex
CREATE INDEX "model_cost_events_modelTier_idx" ON "model_cost_events"("modelTier");

-- CreateIndex
CREATE INDEX "model_cost_events_recordedAt_idx" ON "model_cost_events"("recordedAt");

-- CreateIndex
CREATE INDEX "model_cost_events_domain_idx" ON "model_cost_events"("domain");

-- CreateIndex
CREATE INDEX "agent_kill_switches_agentId_idx" ON "agent_kill_switches"("agentId");

-- CreateIndex
CREATE INDEX "agent_kill_switches_action_idx" ON "agent_kill_switches"("action");

-- CreateIndex
CREATE INDEX "agent_kill_switches_createdAt_idx" ON "agent_kill_switches"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "risk_classifications_actionType_key" ON "risk_classifications"("actionType");

-- CreateIndex
CREATE INDEX "risk_classifications_domain_idx" ON "risk_classifications"("domain");

-- CreateIndex
CREATE INDEX "risk_classifications_riskLevel_idx" ON "risk_classifications"("riskLevel");

-- CreateIndex
CREATE INDEX "risk_classifications_autonomyLevel_idx" ON "risk_classifications"("autonomyLevel");

-- CreateIndex
CREATE INDEX "approval_requests_actionType_idx" ON "approval_requests"("actionType");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- CreateIndex
CREATE INDEX "approval_requests_requestedBy_idx" ON "approval_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "approval_requests_decidedBy_idx" ON "approval_requests"("decidedBy");

-- CreateIndex
CREATE INDEX "approval_requests_createdAt_idx" ON "approval_requests"("createdAt");

-- CreateIndex
CREATE INDEX "risk_assessment_logs_actionType_idx" ON "risk_assessment_logs"("actionType");

-- CreateIndex
CREATE INDEX "risk_assessment_logs_domain_idx" ON "risk_assessment_logs"("domain");

-- CreateIndex
CREATE INDEX "risk_assessment_logs_decision_idx" ON "risk_assessment_logs"("decision");

-- CreateIndex
CREATE INDEX "risk_assessment_logs_assessedBy_idx" ON "risk_assessment_logs"("assessedBy");

-- CreateIndex
CREATE INDEX "risk_assessment_logs_assessedAt_idx" ON "risk_assessment_logs"("assessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "task_classifications_taskType_key" ON "task_classifications"("taskType");

-- CreateIndex
CREATE INDEX "task_classifications_workClass_idx" ON "task_classifications"("workClass");

-- CreateIndex
CREATE INDEX "task_classifications_domain_idx" ON "task_classifications"("domain");

-- CreateIndex
CREATE INDEX "task_classifications_complexityTier_idx" ON "task_classifications"("complexityTier");

-- CreateIndex
CREATE INDEX "task_classifications_automationCandidate_idx" ON "task_classifications"("automationCandidate");

-- CreateIndex
CREATE INDEX "task_classifications_eliminationCandidate_idx" ON "task_classifications"("eliminationCandidate");

-- CreateIndex
CREATE INDEX "task_executions_taskType_idx" ON "task_executions"("taskType");

-- CreateIndex
CREATE INDEX "task_executions_correlationId_idx" ON "task_executions"("correlationId");

-- CreateIndex
CREATE INDEX "task_executions_workClass_idx" ON "task_executions"("workClass");

-- CreateIndex
CREATE INDEX "task_executions_status_idx" ON "task_executions"("status");

-- CreateIndex
CREATE INDEX "task_executions_assignedAgent_idx" ON "task_executions"("assignedAgent");

-- CreateIndex
CREATE INDEX "task_executions_startedAt_idx" ON "task_executions"("startedAt");

-- CreateIndex
CREATE INDEX "capacity_ledger_domain_idx" ON "capacity_ledger"("domain");

-- CreateIndex
CREATE INDEX "capacity_ledger_period_idx" ON "capacity_ledger"("period");

-- CreateIndex
CREATE INDEX "capacity_ledger_taskType_idx" ON "capacity_ledger"("taskType");

-- CreateIndex
CREATE INDEX "agent_portfolio_reviews_agentId_idx" ON "agent_portfolio_reviews"("agentId");

-- CreateIndex
CREATE INDEX "agent_portfolio_reviews_reviewPeriod_idx" ON "agent_portfolio_reviews"("reviewPeriod");

-- AddForeignKey
ALTER TABLE "device_info" ADD CONSTRAINT "device_info_productEventId_fkey" FOREIGN KEY ("productEventId") REFERENCES "product_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_steps" ADD CONSTRAINT "funnel_steps_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "custom_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_evaluations" ADD CONSTRAINT "agent_evaluations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_registry"("agentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_actionType_fkey" FOREIGN KEY ("actionType") REFERENCES "risk_classifications"("actionType") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessment_logs" ADD CONSTRAINT "risk_assessment_logs_actionType_fkey" FOREIGN KEY ("actionType") REFERENCES "risk_classifications"("actionType") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_taskType_fkey" FOREIGN KEY ("taskType") REFERENCES "task_classifications"("taskType") ON DELETE RESTRICT ON UPDATE CASCADE;

