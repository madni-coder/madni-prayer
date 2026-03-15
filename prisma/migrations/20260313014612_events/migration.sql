-- CreateTable
CREATE TABLE "event_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "theme_color" TEXT,
    "submit_label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "schema_fields" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_slug" TEXT NOT NULL,
    "submitted_data" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_pages_slug_key" ON "event_pages"("slug");

-- AddForeignKey
ALTER TABLE "event_submissions" ADD CONSTRAINT "event_submissions_event_slug_fkey" FOREIGN KEY ("event_slug") REFERENCES "event_pages"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
