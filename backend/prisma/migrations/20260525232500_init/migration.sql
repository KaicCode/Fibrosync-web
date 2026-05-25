-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SymptomCategory" AS ENUM ('PAIN', 'FATIGUE', 'SLEEP', 'COGNITIVE', 'MOOD', 'DIGESTIVE', 'MOBILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PredictionSource" AS ENUM ('RULE_ENGINE', 'AI_MODEL', 'CLINICAL_REVIEW');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('DAILY_SUMMARY', 'CRISIS_RISK', 'BEHAVIORAL_PATTERN', 'RECOMMENDATION');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiPredictionRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "birth_date" DATE,
    "gender" VARCHAR(50),
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "country_code" VARCHAR(2),
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
    "role" "Role" NOT NULL DEFAULT 'USER',
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "replaced_by_token_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptoms" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "category" "SymptomCategory" NOT NULL,
    "description" TEXT,
    "unit" VARCHAR(32),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_signals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "fatigue_level" INTEGER NOT NULL,
    "sleep_quality" INTEGER NOT NULL,
    "stiffness" INTEGER NOT NULL,
    "mood" INTEGER NOT NULL,
    "stress" INTEGER NOT NULL,
    "cognitive_fog" BOOLEAN NOT NULL DEFAULT false,
    "sensitivity_light" BOOLEAN NOT NULL DEFAULT false,
    "sensitivity_noise" BOOLEAN NOT NULL DEFAULT false,
    "digestive_issues" BOOLEAN NOT NULL DEFAULT false,
    "headache" BOOLEAN NOT NULL DEFAULT false,
    "anxiety" BOOLEAN NOT NULL DEFAULT false,
    "depression" BOOLEAN NOT NULL DEFAULT false,
    "body_temperature_feeling" VARCHAR(120),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptom_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "record_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pain_level" INTEGER NOT NULL DEFAULT 0,
    "fatigue_level" INTEGER NOT NULL,
    "sleep_hours" DOUBLE PRECISION,
    "sleep_quality" INTEGER,
    "stress_level" INTEGER NOT NULL,
    "mood_level" INTEGER NOT NULL,
    "exercise_minutes" INTEGER,
    "water_intake_liters" DOUBLE PRECISION,
    "medication_adherence" BOOLEAN,
    "weather_feeling" VARCHAR(120),
    "flare_warning_accepted" BOOLEAN,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_entries" (
    "id" UUID NOT NULL,
    "daily_record_id" UUID NOT NULL,
    "symptom_id" UUID NOT NULL,
    "severity" INTEGER NOT NULL,
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptom_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crisis_predictions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "daily_record_id" UUID NOT NULL,
    "predicted_for" DATE NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "confidence_score" DOUBLE PRECISION,
    "risk_factors" JSONB NOT NULL,
    "recommendation_summary" TEXT,
    "source" "PredictionSource" NOT NULL DEFAULT 'RULE_ENGINE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crisis_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "crisis_prediction_id" UUID,
    "dedupe_key" TEXT,
    "type" VARCHAR(64) NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "scheduled_for" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PROCESSING',
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "summary" JSONB,
    "file_url" TEXT,
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "daily_record_id" UUID,
    "type" "InsightType" NOT NULL,
    "status" "InsightStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relevance_score" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_risk_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "analysis_window_days" INTEGER NOT NULL,
    "current_personalized_score" INTEGER NOT NULL,
    "baseline_score" INTEGER NOT NULL,
    "last_crisis_signal_count" INTEGER NOT NULL,
    "summary" TEXT,
    "trigger_patterns" JSONB NOT NULL,
    "personalized_weights" JSONB NOT NULL,
    "source_window_start" DATE NOT NULL,
    "source_window_end" DATE NOT NULL,
    "last_analyzed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_risk_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_predictions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "daily_record_id" UUID,
    "provider" VARCHAR(64) NOT NULL,
    "model" VARCHAR(120) NOT NULL,
    "prompt_version" VARCHAR(32) NOT NULL,
    "probability_score" INTEGER NOT NULL,
    "risk_level" "AiPredictionRiskLevel" NOT NULL,
    "explanation" TEXT NOT NULL,
    "suggested_action" TEXT NOT NULL,
    "input_snapshot" JSONB NOT NULL,
    "provider_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_replaced_by_token_id_key" ON "refresh_tokens"("replaced_by_token_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_expires_at_idx" ON "refresh_tokens"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_revoked_at_idx" ON "refresh_tokens"("user_id", "revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "symptoms_name_key" ON "symptoms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "symptoms_slug_key" ON "symptoms"("slug");

-- CreateIndex
CREATE INDEX "symptoms_category_is_active_idx" ON "symptoms"("category", "is_active");

-- CreateIndex
CREATE INDEX "symptom_signals_user_id_created_at_idx" ON "symptom_signals"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "daily_records_user_id_record_date_idx" ON "daily_records"("user_id", "record_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_records_user_id_record_date_key" ON "daily_records"("user_id", "record_date");

-- CreateIndex
CREATE INDEX "symptom_entries_symptom_id_severity_idx" ON "symptom_entries"("symptom_id", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "symptom_entries_daily_record_id_symptom_id_key" ON "symptom_entries"("daily_record_id", "symptom_id");

-- CreateIndex
CREATE UNIQUE INDEX "crisis_predictions_daily_record_id_key" ON "crisis_predictions"("daily_record_id");

-- CreateIndex
CREATE INDEX "crisis_predictions_user_id_predicted_for_idx" ON "crisis_predictions"("user_id", "predicted_for");

-- CreateIndex
CREATE INDEX "crisis_predictions_risk_level_created_at_idx" ON "crisis_predictions"("risk_level", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_created_at_idx" ON "notifications"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "notifications_scheduled_for_status_idx" ON "notifications"("scheduled_for", "status");

-- CreateIndex
CREATE INDEX "reports_user_id_type_created_at_idx" ON "reports"("user_id", "type", "created_at");
CREATE UNIQUE INDEX "reports_user_id_type_period_start_period_end_key" ON "reports"("user_id", "type", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "ai_insights_user_id_type_created_at_idx" ON "ai_insights"("user_id", "type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_risk_profiles_user_id_key" ON "user_risk_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_risk_profiles_current_personalized_score_updated_at_idx" ON "user_risk_profiles"("current_personalized_score", "updated_at");

-- CreateIndex
CREATE INDEX "user_risk_profiles_last_analyzed_at_idx" ON "user_risk_profiles"("last_analyzed_at");

-- CreateIndex
CREATE INDEX "ai_predictions_user_id_created_at_idx" ON "ai_predictions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_predictions_user_id_risk_level_created_at_idx" ON "ai_predictions"("user_id", "risk_level", "created_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_token_id_fkey" FOREIGN KEY ("replaced_by_token_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_signals" ADD CONSTRAINT "symptom_signals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_entries" ADD CONSTRAINT "symptom_entries_daily_record_id_fkey" FOREIGN KEY ("daily_record_id") REFERENCES "daily_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_entries" ADD CONSTRAINT "symptom_entries_symptom_id_fkey" FOREIGN KEY ("symptom_id") REFERENCES "symptoms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_predictions" ADD CONSTRAINT "crisis_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_predictions" ADD CONSTRAINT "crisis_predictions_daily_record_id_fkey" FOREIGN KEY ("daily_record_id") REFERENCES "daily_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_crisis_prediction_id_fkey" FOREIGN KEY ("crisis_prediction_id") REFERENCES "crisis_predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_daily_record_id_fkey" FOREIGN KEY ("daily_record_id") REFERENCES "daily_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_risk_profiles" ADD CONSTRAINT "user_risk_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_predictions" ADD CONSTRAINT "ai_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_predictions" ADD CONSTRAINT "ai_predictions_daily_record_id_fkey" FOREIGN KEY ("daily_record_id") REFERENCES "daily_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
