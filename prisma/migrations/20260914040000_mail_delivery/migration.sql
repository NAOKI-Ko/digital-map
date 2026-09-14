-- WU-26 / KAN-69: sanitized transactional email delivery tracking.
CREATE TYPE "MailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TABLE "MailDelivery" (
  "id" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "status" "MailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "errorCategory" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "MailDelivery_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MailDelivery_status_createdAt_idx" ON "MailDelivery"("status", "createdAt");
CREATE INDEX "MailDelivery_recipient_createdAt_idx" ON "MailDelivery"("recipient", "createdAt");
