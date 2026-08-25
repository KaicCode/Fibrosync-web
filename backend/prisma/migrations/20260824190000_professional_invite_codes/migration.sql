ALTER TYPE "DoctorPatientAccessStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

CREATE TYPE "DoctorPatientAccessAuditEventType" AS ENUM (
  'DOCTOR_LINK_LOOKUP',
  'DOCTOR_LINK_REQUEST_ATTEMPTED',
  'DOCTOR_LINK_REQUESTED',
  'DOCTOR_LINK_ACCEPTED',
  'DOCTOR_LINK_REJECTED',
  'DOCTOR_LINK_REVOKED',
  'DOCTOR_LINK_ADMIN_GRANTED',
  'DOCTOR_LINK_ADMIN_REVOKED',
  'PATIENT_LINK_CODE_REGENERATED'
);

ALTER TABLE "users"
ADD COLUMN "patient_link_code" VARCHAR(16);

CREATE UNIQUE INDEX "users_patient_link_code_key"
ON "users"("patient_link_code");

ALTER TABLE "doctor_patient_access"
ADD COLUMN "requested_at" TIMESTAMPTZ(3),
ADD COLUMN "responded_at" TIMESTAMPTZ(3);

UPDATE "doctor_patient_access"
SET "requested_at" = COALESCE("requested_at", "created_at");

UPDATE "doctor_patient_access"
SET "responded_at" = COALESCE("responded_at", "authorized_at", "revoked_at", "created_at")
WHERE "status" IN ('ACTIVE', 'REVOKED');

CREATE TABLE "doctor_patient_access_audit_logs" (
  "id" UUID NOT NULL,
  "access_id" UUID,
  "actor_user_id" UUID NOT NULL,
  "doctor_id" UUID,
  "patient_id" UUID,
  "event_type" "DoctorPatientAccessAuditEventType" NOT NULL,
  "previous_status" "DoctorPatientAccessStatus",
  "next_status" "DoctorPatientAccessStatus",
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "doctor_patient_access_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "doctor_patient_access_audit_logs_actor_user_id_event_type_created_at_idx"
ON "doctor_patient_access_audit_logs"("actor_user_id", "event_type", "created_at");

CREATE INDEX "doctor_patient_access_audit_logs_doctor_id_created_at_idx"
ON "doctor_patient_access_audit_logs"("doctor_id", "created_at");

CREATE INDEX "doctor_patient_access_audit_logs_patient_id_created_at_idx"
ON "doctor_patient_access_audit_logs"("patient_id", "created_at");

CREATE INDEX "doctor_patient_access_audit_logs_access_id_created_at_idx"
ON "doctor_patient_access_audit_logs"("access_id", "created_at");
