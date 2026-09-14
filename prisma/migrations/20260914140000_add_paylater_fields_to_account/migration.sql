-- AlterTable
ALTER TABLE "accounts" ADD COLUMN "account_category" TEXT NOT NULL DEFAULT 'REGULAR';
ALTER TABLE "accounts" ADD COLUMN "credit_limit" REAL;
