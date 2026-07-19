-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "figma_access_token" TEXT;

-- CreateTable
CREATE TABLE "figma_file_cache" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "file_key" TEXT NOT NULL,
    "last_modified" TEXT NOT NULL,
    "frames" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "figma_file_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "figma_file_cache_project_id_file_key_key" ON "figma_file_cache"("project_id", "file_key");

-- AddForeignKey
ALTER TABLE "figma_file_cache" ADD CONSTRAINT "figma_file_cache_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
