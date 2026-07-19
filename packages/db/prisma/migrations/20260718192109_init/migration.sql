-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRATOR', 'QA_LEAD', 'QA_ENGINEER', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'INVITED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('READY', 'READY_WITH_WARNINGS', 'NOT_READY');

-- CreateEnum
CREATE TYPE "EnvironmentAuthStatus" AS ENUM ('VERIFIED', 'NOT_CONFIGURED');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('REQUIREMENTS_DOCUMENT', 'BRD', 'PRD', 'ACCEPTANCE_CRITERIA', 'TEST_CASES', 'BUSINESS_RULES', 'CONTENT_SHEETS', 'FIGMA_DESIGN');

-- CreateEnum
CREATE TYPE "KnowledgeSourceStatus" AS ENUM ('PROCESSING', 'PROCESSED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ValidationType" AS ENUM ('UI_VALIDATION', 'FIGMA_COMPARISON', 'CONTENT_VALIDATION', 'GRAMMAR_VALIDATION', 'FUNCTIONAL_VALIDATION');

-- CreateEnum
CREATE TYPE "EngineName" AS ENUM ('DISCOVERY', 'BROWSER', 'FIGMA', 'ELEMENT_MATCHING', 'UI_VALIDATION', 'VISUAL', 'CONTENT', 'FUNCTIONAL', 'ACCESSIBILITY', 'PERFORMANCE', 'SECURITY', 'CONFIDENCE', 'EVIDENCE', 'AI', 'REPORT');

-- CreateEnum
CREATE TYPE "EngineStatus" AS ENUM ('WAITING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('PENDING', 'VALIDATED', 'FAILED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('NEW', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'IGNORED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('SCREENSHOT', 'HIGHLIGHTED_SCREENSHOT', 'DOM_SNAPSHOT', 'HTML_SNAPSHOT', 'CSS_SNAPSHOT', 'CONSOLE_LOGS', 'NETWORK_LOGS', 'API_RESPONSE', 'TRACE_FILE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DEVELOPER', 'MANAGEMENT', 'EXECUTIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'QA_ENGINEER',
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "client_name" TEXT NOT NULL DEFAULT '',
    "base_url" TEXT NOT NULL DEFAULT '',
    "figma_file_url" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'NOT_READY',
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "login_url" TEXT,
    "online" BOOLEAN NOT NULL DEFAULT true,
    "auth_status" "EnvironmentAuthStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "notes" TEXT NOT NULL DEFAULT '',
    "auth_method" TEXT,
    "encrypted_creds" TEXT,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "KnowledgeSourceType" NOT NULL,
    "storage_path" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "KnowledgeSourceStatus" NOT NULL DEFAULT 'PROCESSING',

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" UUID NOT NULL,
    "run_number" SERIAL NOT NULL,
    "project_id" UUID NOT NULL,
    "environment_id" UUID NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'QUEUED',
    "validation_types" "ValidationType"[],
    "started_by_id" UUID NOT NULL,
    "current_engine" "EngineName",
    "current_activity" TEXT,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engine_results" (
    "id" UUID NOT NULL,
    "audit_id" UUID NOT NULL,
    "engine" "EngineName" NOT NULL,
    "status" "EngineStatus" NOT NULL DEFAULT 'WAITING',
    "duration_seconds" INTEGER,
    "findings_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "engine_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "audit_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PageStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" UUID NOT NULL,
    "audit_id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "engine" "EngineName" NOT NULL,
    "severity" "Severity" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "expected_result" TEXT NOT NULL,
    "actual_result" TEXT NOT NULL,
    "business_impact" TEXT NOT NULL DEFAULT '',
    "suggested_resolution" TEXT NOT NULL,
    "status" "FindingStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" UUID NOT NULL,
    "finding_id" UUID NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "storage_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "audit_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "storage_path" TEXT,
    "generated_by_id" UUID NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ai_provider" TEXT NOT NULL DEFAULT 'Anthropic',
    "ai_default_model" TEXT NOT NULL DEFAULT 'claude-sonnet-5',
    "screenshot_quality" TEXT NOT NULL DEFAULT 'High',
    "default_timeout_seconds" INTEGER NOT NULL DEFAULT 30,
    "retry_count" INTEGER NOT NULL DEFAULT 2,
    "default_viewport" TEXT NOT NULL DEFAULT 'Desktop (1440x900)',

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "projects_owner_id_idx" ON "projects"("owner_id");

-- CreateIndex
CREATE INDEX "environments_project_id_idx" ON "environments"("project_id");

-- CreateIndex
CREATE INDEX "knowledge_sources_project_id_idx" ON "knowledge_sources"("project_id");

-- CreateIndex
CREATE INDEX "audits_project_id_idx" ON "audits"("project_id");

-- CreateIndex
CREATE INDEX "audits_environment_id_idx" ON "audits"("environment_id");

-- CreateIndex
CREATE INDEX "audits_status_idx" ON "audits"("status");

-- CreateIndex
CREATE INDEX "audits_started_at_idx" ON "audits"("started_at");

-- CreateIndex
CREATE INDEX "engine_results_audit_id_idx" ON "engine_results"("audit_id");

-- CreateIndex
CREATE INDEX "pages_audit_id_idx" ON "pages"("audit_id");

-- CreateIndex
CREATE INDEX "findings_audit_id_idx" ON "findings"("audit_id");

-- CreateIndex
CREATE INDEX "findings_project_id_idx" ON "findings"("project_id");

-- CreateIndex
CREATE INDEX "findings_severity_idx" ON "findings"("severity");

-- CreateIndex
CREATE INDEX "findings_status_idx" ON "findings"("status");

-- CreateIndex
CREATE INDEX "findings_created_at_idx" ON "findings"("created_at");

-- CreateIndex
CREATE INDEX "evidence_finding_id_idx" ON "evidence"("finding_id");

-- CreateIndex
CREATE INDEX "reports_audit_id_idx" ON "reports"("audit_id");

-- CreateIndex
CREATE INDEX "reports_project_id_idx" ON "reports"("project_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_started_by_id_fkey" FOREIGN KEY ("started_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_results" ADD CONSTRAINT "engine_results_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
