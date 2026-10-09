-- =============================================================================
-- Fase 1.6 — Devolução vinculada ao item vendido
--   * return_items.sale_item_id (FK composta (tenant_id, sale_item_id) -> sale_items)
--     com backfill best-effort: casa por (venda da devolução, produto) SOMENTE quando
--     há exatamente 1 sale_item candidato. Ambíguos/sem correspondência ficam NULL e
--     são reportados via WARNING (nada é inventado).
--   * return_items.condition: TEXT -> enum "ReturnItemCondition" (GOOD/DAMAGED/DEFECTIVE).
--     Valores desconhecidos viram DAMAGED (conservador: não retorna ao estoque como
--     "bom") e são reportados via WARNING.
-- =============================================================================

-- 1. Enum + conversão da coluna condition --------------------------------------
CREATE TYPE "ReturnItemCondition" AS ENUM ('GOOD', 'DAMAGED', 'DEFECTIVE');

DO $$
DECLARE
  n BIGINT;
BEGIN
  SELECT count(*) INTO n FROM "return_items"
   WHERE upper(trim("condition")) NOT IN ('GOOD', 'DAMAGED', 'DEFECTIVE');
  IF n > 0 THEN
    RAISE WARNING 'return_items.condition: % linha(s) com valor desconhecido foram migradas para DAMAGED', n;
  END IF;
END $$;

ALTER TABLE "return_items" ALTER COLUMN "condition" DROP DEFAULT;
ALTER TABLE "return_items"
  ALTER COLUMN "condition" TYPE "ReturnItemCondition"
  USING (
    CASE upper(trim("condition"))
      WHEN 'GOOD'      THEN 'GOOD'
      WHEN 'DAMAGED'   THEN 'DAMAGED'
      WHEN 'DEFECTIVE' THEN 'DEFECTIVE'
      ELSE 'DAMAGED'
    END
  )::"ReturnItemCondition";
ALTER TABLE "return_items" ALTER COLUMN "condition" SET DEFAULT 'GOOD';

-- 2. Coluna sale_item_id + backfill best-effort --------------------------------
ALTER TABLE "return_items" ADD COLUMN "sale_item_id" TEXT;

UPDATE "return_items" ri
   SET "sale_item_id" = m.sale_item_id
  FROM (
    SELECT r.id AS return_item_id, min(si.id) AS sale_item_id
      FROM "return_items" r
      JOIN "return_orders" ro ON ro.id = r.return_order_id AND ro.tenant_id = r.tenant_id
      JOIN "sale_items" si
        ON si.sale_id = ro.sale_id
       AND si.product_id = r.product_id
       AND si.tenant_id = r.tenant_id
     GROUP BY r.id
    HAVING count(*) = 1
  ) m
 WHERE ri.id = m.return_item_id;

DO $$
DECLARE
  n_null BIGINT;
  n_amb  BIGINT;
BEGIN
  SELECT count(*) INTO n_null FROM "return_items" WHERE "sale_item_id" IS NULL;
  SELECT count(*) INTO n_amb FROM (
    SELECT r.id
      FROM "return_items" r
      JOIN "return_orders" ro ON ro.id = r.return_order_id AND ro.tenant_id = r.tenant_id
      JOIN "sale_items" si ON si.sale_id = ro.sale_id AND si.product_id = r.product_id AND si.tenant_id = r.tenant_id
     GROUP BY r.id HAVING count(*) > 1
  ) x;
  IF n_null > 0 THEN
    RAISE WARNING 'return_items.sale_item_id: % linha(s) ficaram NULL (% ambíguas; % sem correspondência). Revisar manualmente.',
      n_null, n_amb, n_null - n_amb;
  END IF;
END $$;

-- 3. Índice + FK composta -------------------------------------------------------
CREATE INDEX "return_items_sale_item_id_idx" ON "return_items"("sale_item_id");
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_tenant_id_sale_item_id_fkey"
  FOREIGN KEY ("tenant_id", "sale_item_id") REFERENCES "sale_items"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
