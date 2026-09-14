ALTER TABLE "Map" ADD COLUMN "currentReleaseId" TEXT;

CREATE TABLE "PublicRelease" (
  "id" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BUILDING',
  "manifestKey" TEXT,
  "failureMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readyAt" TIMESTAMP(3),
  CONSTRAINT "PublicRelease_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Map_currentReleaseId_key" ON "Map"("currentReleaseId");
CREATE INDEX "PublicRelease_mapId_createdAt_idx" ON "PublicRelease"("mapId", "createdAt");
CREATE INDEX "PublicRelease_mapId_status_idx" ON "PublicRelease"("mapId", "status");
ALTER TABLE "Map" ADD CONSTRAINT "Map_currentReleaseId_fkey" FOREIGN KEY ("currentReleaseId") REFERENCES "PublicRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PublicRelease" ADD CONSTRAINT "PublicRelease_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicRelease" ADD CONSTRAINT "PublicRelease_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
