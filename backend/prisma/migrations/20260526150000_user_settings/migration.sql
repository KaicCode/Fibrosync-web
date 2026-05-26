CREATE TABLE "user_settings" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "daily_summary_enabled" BOOLEAN NOT NULL DEFAULT true,
  "daily_summary_time" VARCHAR(5) NOT NULL DEFAULT '08:00',
  "end_of_day_reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
  "end_of_day_reminder_time" VARCHAR(5) NOT NULL DEFAULT '20:00',
  "smart_search_enabled" BOOLEAN NOT NULL DEFAULT true,
  "calendar_insights_enabled" BOOLEAN NOT NULL DEFAULT true,
  "in_app_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
  "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT false,
  "quiet_hours_enabled" BOOLEAN NOT NULL DEFAULT false,
  "quiet_hours_start" VARCHAR(5),
  "quiet_hours_end" VARCHAR(5),
  "clinical_data_sharing_enabled" BOOLEAN NOT NULL DEFAULT false,
  "report_export_confirmation_enabled" BOOLEAN NOT NULL DEFAULT true,
  "device_protection_enabled" BOOLEAN NOT NULL DEFAULT true,
  "permission_review_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");
CREATE INDEX "user_settings_updated_at_idx" ON "user_settings"("updated_at");

ALTER TABLE "user_settings"
ADD CONSTRAINT "user_settings_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
