import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const TEST_DB_URL =
  process.env.TEST_DB_URL ||
  'postgresql://postgres:pgtest@localhost:5544/retail_test?schema=public';

const APP_DB_URL =
  process.env.APP_DB_URL ||
  'postgresql://retail_app:retail_app_secret@localhost:5544/retail_test?schema=public';

describe('Phase 2 PostgreSQL Row-Level Security (RLS) & Role Separation', () => {
  let rootPool: Pool;
  let appPool: Pool;

  let tenantA: string;
  let tenantB: string;
  let userA: string;
  let userB: string;
  let saleA: string;
  let saleB: string;

  beforeAll(async () => {
    rootPool = new Pool({ connectionString: TEST_DB_URL });
    appPool = new Pool({ connectionString: APP_DB_URL });

    tenantA = uuidv4();
    tenantB = uuidv4();
    userA = uuidv4();
    userB = uuidv4();
    saleA = uuidv4();
    saleB = uuidv4();

    // 1. Criar dados de teste usando o pool root (migrator/superuser)
    await rootPool.query(`
      INSERT INTO tenants (id, name, slug, updated_at) VALUES
        ('${tenantA}', 'Tenant RLS Alpha', 'tenant-rls-a-${Date.now()}', NOW()),
        ('${tenantB}', 'Tenant RLS Beta', 'tenant-rls-b-${Date.now()}', NOW());

      INSERT INTO users (id, tenant_id, email, password_hash, name, role, updated_at) VALUES
        ('${userA}', '${tenantA}', 'user_a_${Date.now()}@test.com', 'hash', 'User A', 'ADMIN', NOW()),
        ('${userB}', '${tenantB}', 'user_b_${Date.now()}@test.com', 'hash', 'User B', 'ADMIN', NOW());

      INSERT INTO sales (id, tenant_id, user_id, total, subtotal, discount, status, updated_at) VALUES
        ('${saleA}', '${tenantA}', '${userA}', 150.00, 150.00, 0, 'COMPLETED', NOW()),
        ('${saleB}', '${tenantB}', '${userB}', 350.00, 350.00, 0, 'COMPLETED', NOW());
    `);
  });

  afterAll(async () => {
    if (rootPool) {
      await rootPool.query(`
        DELETE FROM sales WHERE id IN ('${saleA}', '${saleB}');
        DELETE FROM users WHERE id IN ('${userA}', '${userB}');
        DELETE FROM tenants WHERE id IN ('${tenantA}', '${tenantB}');
      `);
      await rootPool.end();
    }
    if (appPool) {
      await appPool.end();
    }
  });

  describe('2.1 Database Roles & Privilege Separation', () => {
    it('ensures retail_app role exists and DOES NOT have rolbypassrls privilege', async () => {
      const res = await rootPool.query(`
        SELECT rolname, rolbypassrls, rolsuper 
        FROM pg_roles 
        WHERE rolname = 'retail_app';
      `);

      expect(res.rowCount).toBe(1);
      expect(res.rows[0].rolname).toBe('retail_app');
      expect(res.rows[0].rolbypassrls).toBe(false);
      expect(res.rows[0].rolsuper).toBe(false);
    });

    it('ensures all tenant tables have Row-Level Security enabled and forced', async () => {
      const tenantTables = [
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
        'users',
      ];

      const res = await rootPool.query(
        `
        SELECT relname, relrowsecurity, relforcerowsecurity 
        FROM pg_class 
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_namespace.nspname = 'public' 
          AND relname = ANY($1::text[]);
      `,
        [tenantTables],
      );

      expect(res.rowCount).toBe(tenantTables.length);
      for (const row of res.rows) {
        expect(row.relrowsecurity).toBe(true);
        expect(row.relforcerowsecurity).toBe(true);
      }
    });
  });

  describe('2.2 & 2.4 Cross-Tenant Leakage & Isolation Verification (retail_app connection)', () => {
    it('FAILS CLOSED: query without app.tenant_id returns 0 rows (never leaks open)', async () => {
      const client = await appPool.connect();
      try {
        const res = await client.query(
          'SELECT * FROM sales WHERE id IN ($1, $2)',
          [saleA, saleB],
        );
        expect(res.rowCount).toBe(0);
      } finally {
        client.release();
      }
    });

    it('filters strictly to tenant A when app.tenant_id = tenantA is set', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT set_config($1, $2, true)', [
          'app.tenant_id',
          tenantA,
        ]);

        const res = await client.query(
          'SELECT id, tenant_id, total FROM sales WHERE id IN ($1, $2)',
          [saleA, saleB],
        );

        expect(res.rowCount).toBe(1);
        expect(res.rows[0].id).toBe(saleA);
        expect(res.rows[0].tenant_id).toBe(tenantA);

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    it('filters strictly to tenant B when app.tenant_id = tenantB is set', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT set_config($1, $2, true)', [
          'app.tenant_id',
          tenantB,
        ]);

        const res = await client.query(
          'SELECT id, tenant_id, total FROM sales WHERE id IN ($1, $2)',
          [saleA, saleB],
        );

        expect(res.rowCount).toBe(1);
        expect(res.rows[0].id).toBe(saleB);
        expect(res.rows[0].tenant_id).toBe(tenantB);

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    it('BLOCKS cross-tenant INSERT: client with tenant A context cannot insert row for tenant B', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT set_config($1, $2, true)', [
          'app.tenant_id',
          tenantA,
        ]);

        const illegalSaleId = uuidv4();
        let error: any = null;

        try {
          await client.query(
            `
            INSERT INTO sales (id, tenant_id, user_id, total, subtotal, discount, status, updated_at)
            VALUES ($1, $2, $3, 99.00, 99.00, 0, 'COMPLETED', NOW())
          `,
            [illegalSaleId, tenantB, userB],
          );
        } catch (err) {
          error = err;
        }

        expect(error).not.toBeNull();
        // PostgreSQL error code 42501 = insufficient_privilege / row-level security policy violation
        expect(error.code).toBe('42501');
        expect(error.message).toMatch(/violates row-level security policy/i);

        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });

    it('PREVENTS cross-tenant UPDATE: client with tenant A context cannot modify tenant B rows', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT set_config($1, $2, true)', [
          'app.tenant_id',
          tenantA,
        ]);

        const res = await client.query(
          `
          UPDATE sales SET total = 9999.00 WHERE id = $1
        `,
          [saleB],
        );

        // 0 rows updated because tenant B row is invisible under RLS
        expect(res.rowCount).toBe(0);

        await client.query('COMMIT');

        // Confirm original value in tenant B was untouched
        const check = await rootPool.query(
          'SELECT total FROM sales WHERE id = $1',
          [saleB],
        );
        expect(Number(check.rows[0].total)).toBe(350.0);
      } finally {
        client.release();
      }
    });

    it('SUPER_ADMIN BYPASS: allows cross-tenant query when bypass_rls=on and role=SUPER_ADMIN', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT set_config($1, $2, true)', [
          'app.bypass_rls',
          'on',
        ]);
        await client.query('SELECT set_config($1, $2, true)', [
          'app.current_user_role',
          'SUPER_ADMIN',
        ]);

        const res = await client.query(
          'SELECT id, tenant_id FROM sales WHERE id IN ($1, $2)',
          [saleA, saleB],
        );

        expect(res.rowCount).toBe(2);
        const ids = res.rows.map((r: any) => r.id);
        expect(ids).toContain(saleA);
        expect(ids).toContain(saleB);

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    it('AUTH LOOKUP: allows unauthenticated email lookup when bypass_rls=on and auth_lookup=on', async () => {
      const client = await appPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT set_config($1, $2, true)', [
          'app.bypass_rls',
          'on',
        ]);
        await client.query('SELECT set_config($1, $2, true)', [
          'app.auth_lookup',
          'on',
        ]);

        const res = await client.query(
          'SELECT id, email, tenant_id FROM users WHERE id = $1',
          [userA],
        );
        expect(res.rowCount).toBe(1);
        expect(res.rows[0].id).toBe(userA);
        expect(res.rows[0].tenant_id).toBe(tenantA);

        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });
  });
});
