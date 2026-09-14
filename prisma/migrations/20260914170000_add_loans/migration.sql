-- CreateTable
CREATE TABLE IF NOT EXISTS "loans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "total_amount" REAL NOT NULL,
    "tenor" INTEGER NOT NULL,
    "monthly_principal" REAL NOT NULL,
    "monthly_interest" REAL NOT NULL,
    "monthly_total" REAL NOT NULL,
    "due_day" INTEGER NOT NULL,
    "remaining_months" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_paid" DATETIME,
    "paylater_account_id" TEXT NOT NULL,
    "source_account_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "loans_paylater_account_id_fkey" FOREIGN KEY ("paylater_account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "loans_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "loans_user_id_idx" ON "loans"("user_id");
CREATE INDEX IF NOT EXISTS "loans_status_idx" ON "loans"("status");
CREATE INDEX IF NOT EXISTS "loans_due_day_idx" ON "loans"("due_day");
