-- AlterTable
ALTER TABLE "environments" ADD COLUMN     "default_timeout_seconds" INTEGER,
ADD COLUMN     "default_viewport" TEXT,
ADD COLUMN     "retry_count" INTEGER,
ADD COLUMN     "screenshot_quality" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "default_timeout_seconds" INTEGER,
ADD COLUMN     "default_viewport" TEXT,
ADD COLUMN     "retry_count" INTEGER,
ADD COLUMN     "screenshot_quality" TEXT;
