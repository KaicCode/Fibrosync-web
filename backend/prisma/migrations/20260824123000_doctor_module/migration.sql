-- AlterTable
ALTER TABLE "users"
ADD COLUMN "professional_clinic" VARCHAR(160),
ADD COLUMN "professional_bio" TEXT;

-- CreateEnum
CREATE TYPE "DoctorPatientAccessStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "doctor_patient_access" (
  "id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "status" "DoctorPatientAccessStatus" NOT NULL DEFAULT 'PENDING',
  "authorized_by_user_id" UUID,
  "authorization_source" VARCHAR(40),
  "authorized_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "doctor_patient_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_notes" (
  "id" UUID NOT NULL,
  "access_id" UUID,
  "doctor_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "doctor_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_patient_access_doctor_id_patient_id_key"
ON "doctor_patient_access"("doctor_id", "patient_id");

-- CreateIndex
CREATE INDEX "doctor_patient_access_doctor_id_status_updated_at_idx"
ON "doctor_patient_access"("doctor_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "doctor_patient_access_patient_id_status_updated_at_idx"
ON "doctor_patient_access"("patient_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "doctor_notes_patient_id_created_at_idx"
ON "doctor_notes"("patient_id", "created_at");

-- CreateIndex
CREATE INDEX "doctor_notes_doctor_id_created_at_idx"
ON "doctor_notes"("doctor_id", "created_at");

-- CreateIndex
CREATE INDEX "doctor_notes_access_id_idx"
ON "doctor_notes"("access_id");

-- AddForeignKey
ALTER TABLE "doctor_patient_access"
ADD CONSTRAINT "doctor_patient_access_doctor_id_fkey"
FOREIGN KEY ("doctor_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_patient_access"
ADD CONSTRAINT "doctor_patient_access_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_patient_access"
ADD CONSTRAINT "doctor_patient_access_authorized_by_user_id_fkey"
FOREIGN KEY ("authorized_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_notes"
ADD CONSTRAINT "doctor_notes_access_id_fkey"
FOREIGN KEY ("access_id") REFERENCES "doctor_patient_access"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_notes"
ADD CONSTRAINT "doctor_notes_doctor_id_fkey"
FOREIGN KEY ("doctor_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_notes"
ADD CONSTRAINT "doctor_notes_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
