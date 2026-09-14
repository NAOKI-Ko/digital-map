-- WU-24 / KAN-53: Spot-level editor assignment and isolated approval revisions.
ALTER TYPE "InvitationPurpose" ADD VALUE 'SPOT_EDITOR';
CREATE TYPE "SpotRevisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Spot" ADD COLUMN "liveVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "OrganizationInvitation" ADD COLUMN "targetSpotId" TEXT;

CREATE TABLE "SpotEditorAssignment" (
  "spotId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assignedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpotEditorAssignment_pkey" PRIMARY KEY ("spotId")
);

CREATE TABLE "SpotRevision" (
  "id" TEXT NOT NULL,
  "spotId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "reviewerId" TEXT,
  "status" "SpotRevisionStatus" NOT NULL DEFAULT 'PENDING',
  "payload" JSONB NOT NULL,
  "baseVersion" INTEGER NOT NULL,
  "rejectReason" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpotRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpotRevisionPhoto" (
  "revisionId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SpotRevisionPhoto_pkey" PRIMARY KEY ("revisionId", "assetId")
);

CREATE INDEX "OrganizationInvitation_targetSpotId_status_idx" ON "OrganizationInvitation"("targetSpotId", "status");
CREATE INDEX "SpotEditorAssignment_userId_idx" ON "SpotEditorAssignment"("userId");
CREATE INDEX "SpotRevision_spotId_status_createdAt_idx" ON "SpotRevision"("spotId", "status", "createdAt");
CREATE INDEX "SpotRevision_authorId_status_idx" ON "SpotRevision"("authorId", "status");
CREATE UNIQUE INDEX "SpotRevision_one_pending_per_spot" ON "SpotRevision"("spotId") WHERE "status" = 'PENDING';
CREATE INDEX "SpotRevisionPhoto_revisionId_order_idx" ON "SpotRevisionPhoto"("revisionId", "order");
CREATE INDEX "SpotRevisionPhoto_assetId_idx" ON "SpotRevisionPhoto"("assetId");

ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_targetSpotId_fkey" FOREIGN KEY ("targetSpotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotEditorAssignment" ADD CONSTRAINT "SpotEditorAssignment_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotEditorAssignment" ADD CONSTRAINT "SpotEditorAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotEditorAssignment" ADD CONSTRAINT "SpotEditorAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpotRevision" ADD CONSTRAINT "SpotRevision_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotRevision" ADD CONSTRAINT "SpotRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpotRevision" ADD CONSTRAINT "SpotRevision_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SpotRevisionPhoto" ADD CONSTRAINT "SpotRevisionPhoto_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "SpotRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpotRevisionPhoto" ADD CONSTRAINT "SpotRevisionPhoto_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
