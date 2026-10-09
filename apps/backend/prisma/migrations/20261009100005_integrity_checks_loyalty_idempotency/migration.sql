-- =============================================================================
-- Fase 1.5 — Concorrência e integridade numérica (SQL manual: Prisma não expressa CHECK)
--
--  * CHECKs: estoque >= 0, saldo >= 0, total = subtotal - discount (e >= 0),
--    quantidades de itens/movimentações > 0.
--  * UNIQUE (account_id, sale_id, type) em loyalty_transactions: idempotência da
--    pontuação por venda. NULLs são distintos em índices únicos do PostgreSQL, logo
--    ajustes manuais (sale_id NULL) nunca conflitam.
--
-- Dados legados que violem um CHECK NÃO são alterados nem apagados: a constraint é
-- criada NOT VALID (vale para novas escritas) e tenta-se VALIDATE; se existirem
-- violações, é emitido um WARNING com a contagem e a constraint permanece NOT VALID
-- até a correção manual (`ALTER TABLE ... VALIDATE CONSTRAINT ...`).
-- =============================================================================

-- Cria CHECK NOT VALID e tenta validar sem derrubar a migration por dados legados.
CREATE OR REPLACE FUNCTION pg_temp.add_check(tbl TEXT, cname TEXT, expr TEXT)
RETURNS VOID LANGUAGE plpgsql AS $fn$
DECLARE
  n BIGINT;
BEGIN
  EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s) NOT VALID', tbl, cname, expr);
  BEGIN
    EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', tbl, cname);
  EXCEPTION WHEN check_violation THEN
    EXECUTE format('SELECT count(*) FROM %I WHERE NOT (%s)', tbl, expr) INTO n;
    RAISE WARNING 'CHECK % em % permanece NOT VALID: % linha(s) legadas violam (%). Corrija e rode VALIDATE CONSTRAINT.',
      cname, tbl, n, expr;
  END;
END
$fn$;

SELECT pg_temp.add_check('products',            'products_stock_quantity_non_negative',   '"stock_quantity" >= 0');
SELECT pg_temp.add_check('loyalty_accounts',    'loyalty_accounts_balance_non_negative',  '"balance" >= 0');
SELECT pg_temp.add_check('sales',               'sales_total_consistent',                 '"total" = "subtotal" - "discount" AND "total" >= 0');
SELECT pg_temp.add_check('sale_items',          'sale_items_quantity_positive',           '"quantity" > 0');
SELECT pg_temp.add_check('inventory_movements', 'inventory_movements_quantity_positive', '"quantity" > 0');

-- Idempotência da fidelidade: diagnóstico de duplicidades legadas antes do UNIQUE
DO $$
DECLARE
  dup RECORD;
  report TEXT := '';
BEGIN
  FOR dup IN
    SELECT account_id, sale_id, type, count(*) AS qty
      FROM "loyalty_transactions"
     WHERE sale_id IS NOT NULL
     GROUP BY account_id, sale_id, type
    HAVING count(*) > 1
  LOOP
    report := report || format(E'\n  account=%s sale=%s type=%s qty=%s', dup.account_id, dup.sale_id, dup.type, dup.qty);
  END LOOP;
  IF report <> '' THEN
    RAISE EXCEPTION E'loyalty_transactions possui lançamentos duplicados por (conta, venda, tipo). Consolide manualmente e reaplique:%', report;
  END IF;
END $$;

CREATE UNIQUE INDEX "loyalty_transactions_account_id_sale_id_type_key"
  ON "loyalty_transactions"("account_id", "sale_id", "type");
