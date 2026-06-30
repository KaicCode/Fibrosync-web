-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('STRETCHING', 'MOBILITY', 'STRENGTHENING', 'BREATHING', 'RELAXATION', 'WALKING');

-- CreateEnum
CREATE TYPE "ExerciseDifficulty" AS ENUM ('VERY_EASY', 'EASY', 'MODERATE', 'HARD', 'VERY_HARD');

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "category" "ExerciseCategory" NOT NULL,
    "difficulty" "ExerciseDifficulty" NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "precautions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_histories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_performed" INTEGER,
    "difficulty_reported" VARCHAR(20),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercises_category_is_active_idx" ON "exercises"("category", "is_active");

-- CreateIndex
CREATE INDEX "exercises_difficulty_is_active_idx" ON "exercises"("difficulty", "is_active");

-- CreateIndex
CREATE INDEX "exercise_histories_user_id_completed_at_idx" ON "exercise_histories"("user_id", "completed_at");

-- CreateIndex
CREATE INDEX "exercise_histories_exercise_id_completed_at_idx" ON "exercise_histories"("exercise_id", "completed_at");

-- AddForeignKey
ALTER TABLE "exercise_histories" ADD CONSTRAINT "exercise_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_histories" ADD CONSTRAINT "exercise_histories_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
