-- AlterTable
ALTER TABLE "users" ADD COLUMN "last_seen_version" TEXT DEFAULT '';

-- CreateTable
CREATE TABLE "app_releases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "released_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "app_releases_version_key" ON "app_releases"("version");
