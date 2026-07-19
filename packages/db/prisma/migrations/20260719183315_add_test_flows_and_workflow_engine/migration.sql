-- CreateEnum
CREATE TYPE "FlowStepAction" AS ENUM ('NAVIGATE', 'CLICK', 'FILL', 'PRESS_KEY', 'ASSERT_VISIBLE', 'ASSERT_TEXT', 'ASSERT_URL');

-- AlterEnum
ALTER TYPE "EngineName" ADD VALUE 'WORKFLOW';

-- CreateTable
CREATE TABLE "test_flows" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "start_url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_steps" (
    "id" UUID NOT NULL,
    "test_flow_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "action" "FlowStepAction" NOT NULL,
    "selector" TEXT,
    "value" TEXT,

    CONSTRAINT "flow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_flows_project_id_idx" ON "test_flows"("project_id");

-- CreateIndex
CREATE INDEX "flow_steps_test_flow_id_idx" ON "flow_steps"("test_flow_id");

-- AddForeignKey
ALTER TABLE "test_flows" ADD CONSTRAINT "test_flows_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_flows" ADD CONSTRAINT "test_flows_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_steps" ADD CONSTRAINT "flow_steps_test_flow_id_fkey" FOREIGN KEY ("test_flow_id") REFERENCES "test_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
