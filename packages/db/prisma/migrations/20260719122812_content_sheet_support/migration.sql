-- AlterEnum
ALTER TYPE "KnowledgeSourceStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "knowledge_sources" ADD COLUMN     "parsed_content" JSONB;
