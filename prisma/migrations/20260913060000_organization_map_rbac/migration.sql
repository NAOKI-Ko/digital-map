-- KAN-52: separate login accounts from organization membership and add map-scoped editors.
-- Existing User.tenantId is the authoritative ownership relationship in the legacy app:
-- every authenticated User had tenant-wide admin access. Abort instead of guessing if
-- a tenant has no owner candidate or if an unsupported legacy role exists.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Tenant" t WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."tenantId" = t."id")) THEN
    RAISE EXCEPTION 'KAN-52 migration blocked: tenant without a deterministically known owner';
  END IF;
  IF EXISTS (SELECT 1 FROM "User" WHERE "role" <> 'admin') THEN
    RAISE EXCEPTION 'KAN-52 migration blocked: unsupported legacy User.role';
  END IF;
END $$;

CREATE TYPE "TenantRole" AS ENUM ('OWNER', 'MEMBER');
CREATE TYPE "MapRole" AS ENUM ('EDITOR');

ALTER TABLE "Tenant"
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "logoAssetId" TEXT,
  ADD COLUMN "websiteUrl" TEXT,
  ADD COLUMN "snsUrl" TEXT;

ALTER TABLE "User" ADD COLUMN "displayName" TEXT;

CREATE TABLE "TenantMember" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "TenantRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MapMember" (
  "id" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "MapRole" NOT NULL DEFAULT 'EDITOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MapMember_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TenantMember" ("id", "tenantId", "userId", "role", "createdAt", "updatedAt")
SELECT 'tm_' || md5("tenantId" || ':' || "id"), "tenantId", "id", 'OWNER'::"TenantRole", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User";

CREATE UNIQUE INDEX "TenantMember_tenantId_userId_key" ON "TenantMember"("tenantId", "userId");
CREATE INDEX "TenantMember_userId_idx" ON "TenantMember"("userId");
CREATE INDEX "TenantMember_tenantId_role_idx" ON "TenantMember"("tenantId", "role");
CREATE UNIQUE INDEX "MapMember_mapId_userId_key" ON "MapMember"("mapId", "userId");
CREATE INDEX "MapMember_userId_idx" ON "MapMember"("userId");

ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MapMember" ADD CONSTRAINT "MapMember_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MapMember" ADD CONSTRAINT "MapMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_logoAssetId_fkey" FOREIGN KEY ("logoAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";
DROP INDEX "User_tenantId_idx";
ALTER TABLE "User" DROP COLUMN "tenantId", DROP COLUMN "role";

COMMIT;
