-- Add medical role support to existing role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MEDICAL';

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_PROFILE', 'ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "specialty" VARCHAR(120),
ADD COLUMN "professional_council_type" VARCHAR(40),
ADD COLUMN "professional_council_number" VARCHAR(40),
ADD COLUMN "professional_council_state" VARCHAR(2),
ADD COLUMN "professional_phone" VARCHAR(32);

-- CreateIndex
CREATE INDEX "users_account_status_idx" ON "users"("account_status");

-- CreateIndex
CREATE UNIQUE INDEX "users_professional_council_identity_key"
ON "users"(
  "professional_council_type",
  "professional_council_number",
  "professional_council_state"
);
