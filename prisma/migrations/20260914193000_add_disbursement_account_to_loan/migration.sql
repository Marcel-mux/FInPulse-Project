-- AlterTable
ALTER TABLE "loans" ADD COLUMN "disbursement_account_id" TEXT REFERENCES "accounts"("id") ON DELETE SET NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "loans_disbursement_account_id_idx" ON "loans"("disbursement_account_id");
