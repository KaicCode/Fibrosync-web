ALTER TABLE "daily_records"
ADD COLUMN "pain_type" VARCHAR(120),
ADD COLUMN "pain_areas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "pain_triggers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "daily_records"
SET
  "pain_type" = NULLIF(TRIM("metadata"->>'painType'), ''),
  "pain_areas" = COALESCE(
    ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE("metadata"->'painAreas', '[]'::jsonb)
      )
    ),
    ARRAY[]::TEXT[]
  ),
  "pain_triggers" = COALESCE(
    ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE("metadata"->'painTriggers', '[]'::jsonb)
      )
    ),
    ARRAY[]::TEXT[]
  )
WHERE "metadata" IS NOT NULL;

DROP INDEX "daily_records_user_id_record_date_key";

CREATE INDEX "daily_records_user_id_created_at_idx"
ON "daily_records"("user_id", "created_at");
