ALTER TABLE "daily_records"
ADD COLUMN "derived_signals" BOOLEAN NOT NULL DEFAULT false;

UPDATE "daily_records"
SET "derived_signals" = true;

ALTER TABLE "symptom_signals"
ADD COLUMN "daily_record_id" UUID,
ADD COLUMN "cognitive_fog_level" INTEGER,
ADD COLUMN "sensitivity_light_level" INTEGER,
ADD COLUMN "sensitivity_noise_level" INTEGER,
ADD COLUMN "digestive_issues_level" INTEGER,
ADD COLUMN "headache_level" INTEGER,
ADD COLUMN "anxiety_level" INTEGER,
ADD COLUMN "depression_level" INTEGER;

UPDATE "symptom_signals"
SET
  "cognitive_fog_level" = CASE WHEN "cognitive_fog" THEN 5 ELSE NULL END,
  "sensitivity_light_level" = CASE WHEN "sensitivity_light" THEN 5 ELSE NULL END,
  "sensitivity_noise_level" = CASE WHEN "sensitivity_noise" THEN 5 ELSE NULL END,
  "digestive_issues_level" = CASE WHEN "digestive_issues" THEN 5 ELSE NULL END,
  "headache_level" = CASE WHEN "headache" THEN 5 ELSE NULL END,
  "anxiety_level" = CASE WHEN "anxiety" THEN 5 ELSE NULL END,
  "depression_level" = CASE WHEN "depression" THEN 5 ELSE NULL END;

CREATE INDEX "symptom_signals_daily_record_id_idx"
ON "symptom_signals"("daily_record_id");

ALTER TABLE "symptom_signals"
ADD CONSTRAINT "symptom_signals_daily_record_id_fkey"
FOREIGN KEY ("daily_record_id") REFERENCES "daily_records"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
