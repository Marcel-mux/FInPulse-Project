-- AlterTable
ALTER TABLE "users" ADD COLUMN "whatsapp_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_whatsapp_number_key" ON "users"("whatsapp_number");
