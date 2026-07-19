-- AlterTable
ALTER TABLE "figma_file_cache" ADD COLUMN     "elements" JSONB NOT NULL DEFAULT '[]';
