-- AlterTable
ALTER TABLE "audits" ADD COLUMN     "ai_executive_summary" TEXT;

-- AlterTable
ALTER TABLE "findings" ADD COLUMN     "ai_explanation" TEXT;
