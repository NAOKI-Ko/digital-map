CREATE TYPE "TenantOnboardingState" AS ENUM ('SETUP', 'ACTIVE');
ALTER TABLE "Tenant" ADD COLUMN "onboardingState" "TenantOnboardingState" NOT NULL DEFAULT 'SETUP';
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "SignupIntent" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "organizationName" TEXT NOT NULL,
  "verificationTokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "termsVersion" TEXT NOT NULL,
  "privacyVersion" TEXT NOT NULL,
  "createdUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SignupIntent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SignupIntent_verificationTokenHash_key" ON "SignupIntent"("verificationTokenHash");
CREATE INDEX "SignupIntent_email_createdAt_idx" ON "SignupIntent"("email", "createdAt");
CREATE INDEX "SignupIntent_expiresAt_completedAt_idx" ON "SignupIntent"("expiresAt", "completedAt");
ALTER TABLE "SignupIntent" ADD CONSTRAINT "SignupIntent_createdUserId_fkey" FOREIGN KEY ("createdUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LegalAcceptance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "termsVersion" TEXT NOT NULL,
  "privacyVersion" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalAcceptance_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LegalAcceptance_userId_acceptedAt_idx" ON "LegalAcceptance"("userId", "acceptedAt");
CREATE INDEX "LegalAcceptance_tenantId_acceptedAt_idx" ON "LegalAcceptance"("tenantId", "acceptedAt");
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
