-- =============================================================================
-- Fase 1.3 — Integridade cross-tenant: FKs COMPOSTAS (tenant_id, x_id) -> (tenant_id, id)
--
-- Problema: as FKs usavam só `id`; o banco aceitava, p.ex., uma venda do tenant A
-- apontando para cliente/produto do tenant B.
--
-- Passos:
--   0. DIAGNÓSTICO: detecta linhas JÁ inconsistentes entre tenants. Se houver, a
--      migration ABORTA com o relatório (nada é apagado ou corrigido
--      automaticamente — decisão humana).
--   1. UNIQUE (tenant_id, id) nos pais (alvo das FKs compostas).
--   2. Troca das FKs simples pelas compostas. MATCH SIMPLE (padrão do Postgres):
--      se a coluna opcional for NULL a FK não é verificada, como antes.
--
-- Observações:
--   * Relações OPCIONAIS passam de ON DELETE SET NULL para RESTRICT: SET NULL
--     anularia também `tenant_id` (NOT NULL). O Prisma também recusa SetNull aqui.
--     Efeito: excluir um cliente que possui vendas/devoluções/condicionais agora é
--     bloqueado pelo banco (a aplicação traduz para 409; use "desativar").
--   * Os nomes seguem a convenção do Prisma (`<tabela>_<col1>_<col2>_fkey`) para não
--     gerar drift em `prisma migrate dev`.
-- =============================================================================

-- 0. Diagnóstico de dados cross-tenant pré-existentes -------------------------
DO $$
DECLARE
  r      RECORD;
  n      BIGINT;
  sample TEXT;
  report TEXT := '';
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('sales',                  'user_id',         'users'),
      ('sales',                  'customer_id',     'customers'),
      ('sale_items',             'sale_id',         'sales'),
      ('sale_items',             'product_id',      'products'),
      ('payments',               'sale_id',         'sales'),
      ('conditionals',           'user_id',         'users'),
      ('conditionals',           'customer_id',     'customers'),
      ('conditional_items',      'conditional_id',  'conditionals'),
      ('conditional_items',      'product_id',      'products'),
      ('inventory_movements',    'product_id',      'products'),
      ('inventory_movements',    'user_id',         'users'),
      ('return_orders',          'sale_id',         'sales'),
      ('return_orders',          'user_id',         'users'),
      ('return_orders',          'approved_by',     'users'),
      ('return_orders',          'customer_id',     'customers'),
      ('return_items',           'return_order_id', 'return_orders'),
      ('return_items',           'product_id',      'products'),
      ('loyalty_accounts',       'customer_id',     'customers'),
      ('loyalty_transactions',   'account_id',      'loyalty_accounts'),
      ('loyalty_transactions',   'sale_id',         'sales'),
      ('financial_accounts',     'sale_id',         'sales'),
      ('commission_transactions','user_id',         'users'),
      ('commission_transactions','sale_id',         'sales')
    ) AS t(child, col, parent)
  LOOP
    EXECUTE format(
      'SELECT count(*), string_agg(c.id::text, '', '') FILTER (WHERE true)
         FROM (SELECT c.id FROM %I c JOIN %I p ON p.id = c.%I
                WHERE p.tenant_id <> c.tenant_id LIMIT 10) c',
      r.child, r.parent, r.col)
      INTO n, sample;
    IF n > 0 THEN
      report := report || format(E'\n  %s.%s -> %s (amostra de ids: %s)', r.child, r.col, r.parent, sample);
    END IF;
  END LOOP;

  IF report <> '' THEN
    RAISE EXCEPTION E'Dados inconsistentes entre tenants (FK aponta para registro de OUTRO tenant). Corrija manualmente e reaplique a migration:%', report;
  END IF;
END $$;

-- 1. UNIQUE (tenant_id, id) nos pais -----------------------------------------
CREATE UNIQUE INDEX "users_tenant_id_id_key"           ON "users"("tenant_id", "id");
CREATE UNIQUE INDEX "products_tenant_id_id_key"        ON "products"("tenant_id", "id");
CREATE UNIQUE INDEX "customers_tenant_id_id_key"       ON "customers"("tenant_id", "id");
CREATE UNIQUE INDEX "sales_tenant_id_id_key"           ON "sales"("tenant_id", "id");
CREATE UNIQUE INDEX "sale_items_tenant_id_id_key"      ON "sale_items"("tenant_id", "id");
CREATE UNIQUE INDEX "conditionals_tenant_id_id_key"    ON "conditionals"("tenant_id", "id");
CREATE UNIQUE INDEX "return_orders_tenant_id_id_key"   ON "return_orders"("tenant_id", "id");
CREATE UNIQUE INDEX "loyalty_accounts_tenant_id_id_key" ON "loyalty_accounts"("tenant_id", "id");
-- 1:1 sale <-> commission precisa de unicidade sobre as colunas da FK composta
CREATE UNIQUE INDEX "commission_transactions_tenant_id_sale_id_key" ON "commission_transactions"("tenant_id", "sale_id");

-- 2. Troca das FKs ------------------------------------------------------------
-- sales
ALTER TABLE "sales" DROP CONSTRAINT "sales_user_id_fkey";
ALTER TABLE "sales" DROP CONSTRAINT "sales_customer_id_fkey";
ALTER TABLE "sales" ADD CONSTRAINT "sales_tenant_id_user_id_fkey"
  FOREIGN KEY ("tenant_id", "user_id") REFERENCES "users"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_tenant_id_customer_id_fkey"
  FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "customers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- sale_items
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_sale_id_fkey";
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_product_id_fkey";
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_tenant_id_sale_id_fkey"
  FOREIGN KEY ("tenant_id", "sale_id") REFERENCES "sales"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_tenant_id_product_id_fkey"
  FOREIGN KEY ("tenant_id", "product_id") REFERENCES "products"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- payments
ALTER TABLE "payments" DROP CONSTRAINT "payments_sale_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_sale_id_fkey"
  FOREIGN KEY ("tenant_id", "sale_id") REFERENCES "sales"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- conditionals
ALTER TABLE "conditionals" DROP CONSTRAINT "conditionals_user_id_fkey";
ALTER TABLE "conditionals" DROP CONSTRAINT "conditionals_customer_id_fkey";
ALTER TABLE "conditionals" ADD CONSTRAINT "conditionals_tenant_id_user_id_fkey"
  FOREIGN KEY ("tenant_id", "user_id") REFERENCES "users"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conditionals" ADD CONSTRAINT "conditionals_tenant_id_customer_id_fkey"
  FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "customers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- conditional_items
ALTER TABLE "conditional_items" DROP CONSTRAINT "conditional_items_conditional_id_fkey";
ALTER TABLE "conditional_items" DROP CONSTRAINT "conditional_items_product_id_fkey";
ALTER TABLE "conditional_items" ADD CONSTRAINT "conditional_items_tenant_id_conditional_id_fkey"
  FOREIGN KEY ("tenant_id", "conditional_id") REFERENCES "conditionals"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conditional_items" ADD CONSTRAINT "conditional_items_tenant_id_product_id_fkey"
  FOREIGN KEY ("tenant_id", "product_id") REFERENCES "products"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- inventory_movements
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_product_id_fkey";
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_user_id_fkey";
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_tenant_id_product_id_fkey"
  FOREIGN KEY ("tenant_id", "product_id") REFERENCES "products"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_tenant_id_user_id_fkey"
  FOREIGN KEY ("tenant_id", "user_id") REFERENCES "users"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- return_orders
ALTER TABLE "return_orders" DROP CONSTRAINT "return_orders_sale_id_fkey";
ALTER TABLE "return_orders" DROP CONSTRAINT "return_orders_user_id_fkey";
ALTER TABLE "return_orders" DROP CONSTRAINT "return_orders_approved_by_fkey";
ALTER TABLE "return_orders" DROP CONSTRAINT "return_orders_customer_id_fkey";
ALTER TABLE "return_orders" ADD CONSTRAINT "return_orders_tenant_id_sale_id_fkey"
  FOREIGN KEY ("tenant_id", "sale_id") REFERENCES "sales"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "return_orders" ADD CONSTRAINT "return_orders_tenant_id_user_id_fkey"
  FOREIGN KEY ("tenant_id", "user_id") REFERENCES "users"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "return_orders" ADD CONSTRAINT "return_orders_tenant_id_approved_by_fkey"
  FOREIGN KEY ("tenant_id", "approved_by") REFERENCES "users"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "return_orders" ADD CONSTRAINT "return_orders_tenant_id_customer_id_fkey"
  FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "customers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- return_items (a FK para sale_items entra na migration 1.6)
ALTER TABLE "return_items" DROP CONSTRAINT "return_items_return_order_id_fkey";
ALTER TABLE "return_items" DROP CONSTRAINT "return_items_product_id_fkey";
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_tenant_id_return_order_id_fkey"
  FOREIGN KEY ("tenant_id", "return_order_id") REFERENCES "return_orders"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_tenant_id_product_id_fkey"
  FOREIGN KEY ("tenant_id", "product_id") REFERENCES "products"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- loyalty
ALTER TABLE "loyalty_accounts" DROP CONSTRAINT "loyalty_accounts_customer_id_fkey";
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_tenant_id_customer_id_fkey"
  FOREIGN KEY ("tenant_id", "customer_id") REFERENCES "customers"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "loyalty_transactions_account_id_fkey";
ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "loyalty_transactions_sale_id_fkey";
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_tenant_id_account_id_fkey"
  FOREIGN KEY ("tenant_id", "account_id") REFERENCES "loyalty_accounts"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_tenant_id_sale_id_fkey"
  FOREIGN KEY ("tenant_id", "sale_id") REFERENCES "sales"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- finance
ALTER TABLE "financial_accounts" DROP CONSTRAINT "financial_accounts_sale_id_fkey";
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_tenant_id_sale_id_fkey"
  FOREIGN KEY ("tenant_id", "sale_id") REFERENCES "sales"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- commissions
ALTER TABLE "commission_transactions" DROP CONSTRAINT "commission_transactions_user_id_fkey";
ALTER TABLE "commission_transactions" DROP CONSTRAINT "commission_transactions_sale_id_fkey";
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_tenant_id_user_id_fkey"
  FOREIGN KEY ("tenant_id", "user_id") REFERENCES "users"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_tenant_id_sale_id_fkey"
  FOREIGN KEY ("tenant_id", "sale_id") REFERENCES "sales"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
