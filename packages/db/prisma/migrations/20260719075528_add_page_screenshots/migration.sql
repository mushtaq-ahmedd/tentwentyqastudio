-- CreateTable
CREATE TABLE "page_screenshots" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "audit_id" UUID NOT NULL,
    "page_url" TEXT NOT NULL,
    "screenshot_path" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_screenshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_screenshots_project_id_page_url_captured_at_idx" ON "page_screenshots"("project_id", "page_url", "captured_at");

-- AddForeignKey
ALTER TABLE "page_screenshots" ADD CONSTRAINT "page_screenshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
