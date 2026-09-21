CREATE TYPE "PaperDesignRequestStatus" AS ENUM ('REQUESTED', 'CONTACTED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED');

CREATE TABLE "PaperMap" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configVersion" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaperMap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaperDesignRequest" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "paperMapId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "status" "PaperDesignRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requirements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaperDesignRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaperMap_mapId_updatedAt_idx" ON "PaperMap"("mapId", "updatedAt");
CREATE INDEX "PaperMap_createdById_idx" ON "PaperMap"("createdById");
CREATE INDEX "PaperDesignRequest_mapId_createdAt_idx" ON "PaperDesignRequest"("mapId", "createdAt");
CREATE INDEX "PaperDesignRequest_paperMapId_idx" ON "PaperDesignRequest"("paperMapId");

ALTER TABLE "PaperMap" ADD CONSTRAINT "PaperMap_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaperMap" ADD CONSTRAINT "PaperMap_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaperDesignRequest" ADD CONSTRAINT "PaperDesignRequest_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaperDesignRequest" ADD CONSTRAINT "PaperDesignRequest_paperMapId_fkey" FOREIGN KEY ("paperMapId") REFERENCES "PaperMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
