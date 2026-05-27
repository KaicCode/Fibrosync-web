CREATE TABLE "weather_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "apparent_temperature" DOUBLE PRECISION NOT NULL,
    "precipitation" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "wind_speed" DOUBLE PRECISION NOT NULL,
    "weather_code" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "weather_records_user_id_created_at_idx"
ON "weather_records"("user_id", "created_at");

CREATE INDEX "weather_records_created_at_idx"
ON "weather_records"("created_at");

ALTER TABLE "weather_records"
ADD CONSTRAINT "weather_records_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
