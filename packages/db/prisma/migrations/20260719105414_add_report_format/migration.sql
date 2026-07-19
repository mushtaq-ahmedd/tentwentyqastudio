-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'CSV');

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "format" "ReportFormat" NOT NULL DEFAULT 'PDF';
