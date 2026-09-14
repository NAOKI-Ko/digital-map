-- WU-27 / KAN-66: process-shared PostgreSQL rate-limit buckets.
CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "namespace" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "windowEnd" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "RateLimitBucket_namespace_windowEnd_idx" ON "RateLimitBucket"("namespace", "windowEnd");
