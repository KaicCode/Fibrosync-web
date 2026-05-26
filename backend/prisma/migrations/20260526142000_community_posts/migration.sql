CREATE TYPE "CommunityPostType" AS ENUM ('FEED', 'QUESTION', 'INSIGHT');

CREATE TABLE "community_posts" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" "CommunityPostType" NOT NULL DEFAULT 'FEED',
  "content" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "likes_count" INTEGER NOT NULL DEFAULT 0,
  "comments_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "community_posts"
ADD CONSTRAINT "community_posts_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE INDEX "community_posts_created_at_idx"
ON "community_posts"("created_at");

CREATE INDEX "community_posts_type_created_at_idx"
ON "community_posts"("type", "created_at");

CREATE INDEX "community_posts_user_id_created_at_idx"
ON "community_posts"("user_id", "created_at");
