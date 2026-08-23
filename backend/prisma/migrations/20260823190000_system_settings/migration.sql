CREATE TABLE "system_settings" (
    "id" VARCHAR(32) NOT NULL,
    "ai_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "symptom_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "attention_moderate_threshold" INTEGER NOT NULL DEFAULT 40,
    "attention_high_threshold" INTEGER NOT NULL DEFAULT 65,
    "attention_critical_threshold" INTEGER NOT NULL DEFAULT 85,
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_settings_audit_logs" (
    "id" UUID NOT NULL,
    "system_settings_id" VARCHAR(32) NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by_user_id" UUID,
    "changed_by_name" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "system_settings_updated_at_idx"
ON "system_settings"("updated_at");

CREATE INDEX "system_settings_audit_logs_system_settings_id_created_at_idx"
ON "system_settings_audit_logs"("system_settings_id", "created_at");

CREATE INDEX "system_settings_audit_logs_changed_by_user_id_idx"
ON "system_settings_audit_logs"("changed_by_user_id");

ALTER TABLE "system_settings"
ADD CONSTRAINT "system_settings_updated_by_user_id_fkey"
FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "system_settings_audit_logs"
ADD CONSTRAINT "system_settings_audit_logs_system_settings_id_fkey"
FOREIGN KEY ("system_settings_id") REFERENCES "system_settings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "system_settings_audit_logs"
ADD CONSTRAINT "system_settings_audit_logs_changed_by_user_id_fkey"
FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "system_settings" (
    "id",
    "updated_at"
)
VALUES (
    'global',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
