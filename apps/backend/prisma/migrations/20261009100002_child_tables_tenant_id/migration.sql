-- =============================================================================
-- Fase 1.2 — tenant_id nas tabelas filhas (sale_items, conditional_items,
-- return_items). Necessário para RLS simples e para as FKs compostas (1.3).
--
-- Ordem segura: coluna NULLABLE -> BACKFILL a partir do pai -> NOT NULL -> FK/índice.
-- Se houver filhos órfãos (pai inexistente) a migration aborta com relatório.
-- =============================================================================

-- 1. Colunas nullable
ALTER TABLE "sale_items"        ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "conditional_items" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "return_items"      ADD COLUMN "tenant_id" TEXT;

-- 2. Backfill a partir do pai
UPDATE "sale_items" si
   SET "tenant_id" = s."tenant_id"
  FROM "sales" s
 WHERE s."id" = si."sale_id";

UPDATE "conditional_items" ci
   SET "tenant_id" = c."tenant_id"
  FROM "conditionals" c
 WHERE c."id" = ci."conditional_id";

UPDATE "return_items" ri
   SET "tenant_id" = ro."tenant_id"
  FROM "return_orders" ro
 WHERE ro."id" = ri."return_order_id";

-- 3. Diagnóstico: nada pode ficar sem tenant_id
DO $$
DECLARE
  n_si BIGINT; n_ci BIGINT; n_ri BIGINT;
BEGIN
  SELECT count(*) INTO n_si FROM "sale_items"        WHERE "tenant_id" IS NULL;
  SELECT count(*) INTO n_ci FROM "conditional_items" WHERE "tenant_id" IS NULL;
  SELECT count(*) INTO n_ri FROM "return_items"      WHERE "tenant_id" IS NULL;
  IF n_si + n_ci + n_ri > 0 THEN
    RAISE EXCEPTION 'backfill de tenant_id incompleto (órfãos): sale_items=%, conditional_items=%, return_items=%', n_si, n_ci, n_ri;
  END IF;
END $$;

-- 4. NOT NULL
ALTER TABLE "sale_items"        ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "conditional_items" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "return_items"      ALTER COLUMN "tenant_id" SET NOT NULL;

-- 5. Índices e FK simples para tenants
CREATE INDEX "sale_items_tenant_id_idx"        ON "sale_items"("tenant_id");
CREATE INDEX "conditional_items_tenant_id_idx" ON "conditional_items"("tenant_id");
CREATE INDEX "return_items_tenant_id_idx"      ON "return_items"("tenant_id");

ALTER TABLE "sale_items"        ADD CONSTRAINT "sale_items_tenant_id_fkey"        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conditional_items" ADD CONSTRAINT "conditional_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "return_items"      ADD CONSTRAINT "return_items_tenant_id_fkey"      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
