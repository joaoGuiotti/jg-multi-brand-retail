const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/retail_saas?schema=public' });

async function main() {
  try {
    const res = await pool.query('SELECT id, tenant_id as "tenantId", email FROM users WHERE email = $1', ['admin@lojademo.com']);
    if (res.rows.length > 0) {
      console.log(JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log('User not found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
