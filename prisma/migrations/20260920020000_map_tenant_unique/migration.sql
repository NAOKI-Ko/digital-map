DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Map"
    GROUP BY "tenantId"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'WU-49 cannot enforce one Map per Tenant because duplicate tenantId values exist';
  END IF;
END
$$;

DROP INDEX "Map_tenantId_idx";
CREATE UNIQUE INDEX "Map_tenantId_key" ON "Map"("tenantId");
