-- Dados LEGADOS (schema anterior à Fase 1) usados para testar migrations/backfill.
-- Inserido APÓS as migrations até 20260602201820 e ANTES das migrations da Fase 1.
-- Cenários cobertos:
--   * customers.document: '' (1 único permitido pelo schema antigo), com máscara e sem máscara
--   * mesmo CNPJ em tenants diferentes só é possível após a migration (não inserido aqui)
--   * sale_items/conditional_items/return_items sem tenant_id (backfill a partir do pai)
--   * return_items com match único (ri-1), ambíguo (ri-2: 2 sale_items do mesmo produto)
--     e condition com valores variados (case-insensitive / desconhecido)

INSERT INTO tenants (id, name, slug, updated_at) VALUES
  ('t-1', 'Loja Um',  'loja-um',  now()),
  ('t-2', 'Loja Dois','loja-dois',now());

INSERT INTO users (id, tenant_id, email, password_hash, role, name, updated_at) VALUES
  ('u-1', 't-1', 'a@um.test',   'x', 'ADMIN', 'Admin Um',   now()),
  ('u-2', 't-2', 'a@dois.test', 'x', 'ADMIN', 'Admin Dois', now());

INSERT INTO customers (id, tenant_id, first_name, last_name, email, phone, document, street, number, city, state, zip_code, updated_at) VALUES
  ('c-1', 't-1', 'Ana',   'Sem Doc',  'ana@um.test',   '1', '',               'r', '1', 'c', 'SP', '1', now()),
  ('c-2', 't-1', 'Bia',   'Mascara',  'bia@um.test',   '1', '529.982.247-25', 'r', '1', 'c', 'SP', '1', now()),
  ('c-3', 't-2', 'Caio',  'Cnpj',     'caio@dois.test','1', '11222333000181', 'r', '1', 'c', 'SP', '1', now());

INSERT INTO products (id, tenant_id, name, sku, cost_price, sale_price, margin, stock_quantity, updated_at) VALUES
  ('p-1', 't-1', 'Camisa', 'SKU-1', 10, 20, 100, 5, now()),
  ('p-2', 't-2', 'Calça',  'SKU-1', 10, 20, 100, 5, now());

INSERT INTO sales (id, tenant_id, user_id, customer_id, subtotal, discount, total, status, updated_at) VALUES
  ('s-1', 't-1', 'u-1', 'c-2', 40, 0, 40, 'COMPLETED', now()),
  ('s-2', 't-1', 'u-1', 'c-2', 60, 0, 60, 'COMPLETED', now());

INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount, total) VALUES
  ('si-1', 's-1', 'p-1', 2, 20, 0, 40),
  ('si-2', 's-2', 'p-1', 1, 20, 0, 20),
  ('si-3', 's-2', 'p-1', 2, 20, 0, 40);

INSERT INTO return_orders (id, tenant_id, sale_id, user_id, customer_id, status, refund_type, total_refund) VALUES
  ('ro-1', 't-1', 's-1', 'u-1', 'c-2', 'REQUESTED', 'CASH_REFUND', 20),
  ('ro-2', 't-1', 's-2', 'u-1', 'c-2', 'REQUESTED', 'CASH_REFUND', 20);

INSERT INTO return_items (id, return_order_id, product_id, quantity, unit_price, total, condition) VALUES
  ('ri-1', 'ro-1', 'p-1', 1, 20, 20, 'GOOD'),
  ('ri-2', 'ro-2', 'p-1', 1, 20, 20, 'damaged'),
  ('ri-3', 'ro-1', 'p-1', 1, 20, 20, 'WEIRD');

INSERT INTO conditionals (id, tenant_id, user_id, customer_id) VALUES ('cd-1', 't-1', 'u-1', 'c-1');
INSERT INTO conditional_items (id, conditional_id, product_id, quantity, unit_price) VALUES ('cdi-1', 'cd-1', 'p-1', 1, 20);

INSERT INTO loyalty_programs (id, tenant_id, updated_at) VALUES ('lp-1', 't-1', now());
INSERT INTO loyalty_accounts (id, tenant_id, customer_id, loyalty_program_id, balance) VALUES ('la-1', 't-1', 'c-2', 'lp-1', 40);
INSERT INTO loyalty_transactions (id, tenant_id, account_id, type, points, sale_id) VALUES
  ('lt-1', 't-1', 'la-1', 'EARN', 40, 's-1'),
  ('lt-2', 't-1', 'la-1', 'ADJUST', 5, NULL),
  ('lt-3', 't-1', 'la-1', 'ADJUST', -5, NULL);
