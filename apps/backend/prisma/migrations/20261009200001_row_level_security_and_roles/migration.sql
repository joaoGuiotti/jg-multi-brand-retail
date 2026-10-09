-- Migration: 20261009200001_row_level_security_and_roles
-- FASE 2: PostgreSQL Roles e Row-Level Security (RLS) Multi-Tenant

-- 1. Criação do papel da aplicação (retail_app) sem BYPASSRLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'retail_app') THEN
    CREATE ROLE retail_app WITH LOGIN PASSWORD 'retail_app_secret' NOBYPASSRLS;
  ELSE
    ALTER ROLE retail_app WITH NOBYPASSRLS;
  END IF;
END
$$;

-- 2. Concessão de privilégios ao retail_app no schema public
GRANT USAGE ON SCHEMA public TO retail_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO retail_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO retail_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO retail_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO retail_app;

-- 3. Habilitação de RLS e FORCE RLS em todas as tabelas com tenant_id
DO $$
DECLARE
  tbl text;
  tenant_tables text[] := ARRAY[
    'audit_logs',
    'brands',
    'categories',
    'commission_transactions',
    'conditional_items',
    'conditionals',
    'customers',
    'financial_accounts',
    'inventory_movements',
    'loyalty_accounts',
    'loyalty_programs',
    'loyalty_transactions',
    'notification_preferences',
    'notifications',
    'password_reset_tokens',
    'payments',
    'products',
    'refresh_tokens',
    'return_items',
    'return_orders',
    'sale_items',
    'sales',
    'sales_targets',
    'suppliers',
    'users'
  ];
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation_policy ON %I
        FOR ALL
        USING (
          (current_setting('app.bypass_rls', true) = 'on' AND (
            current_setting('app.current_user_role', true) = 'SUPER_ADMIN'
            OR current_setting('app.auth_lookup', true) = 'on'
          ))
          OR
          (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::varchar(36))
        )
        WITH CHECK (
          (current_setting('app.bypass_rls', true) = 'on' AND (
            current_setting('app.current_user_role', true) = 'SUPER_ADMIN'
            OR current_setting('app.auth_lookup', true) = 'on'
          ))
          OR
          (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::varchar(36))
        );
    $pol$, tbl);
  END LOOP;
END
$$;

-- 4. RLS na tabela tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenants_isolation_policy ON tenants;
CREATE POLICY tenants_isolation_policy ON tenants
  FOR ALL
  USING (
    (current_setting('app.bypass_rls', true) = 'on' AND current_setting('app.current_user_role', true) = 'SUPER_ADMIN')
    OR
    (id = NULLIF(current_setting('app.tenant_id', true), '')::varchar(36))
    OR
    (active = true)
  )
  WITH CHECK (
    (current_setting('app.bypass_rls', true) = 'on' AND current_setting('app.current_user_role', true) = 'SUPER_ADMIN')
    OR
    (id = NULLIF(current_setting('app.tenant_id', true), '')::varchar(36))
  );
