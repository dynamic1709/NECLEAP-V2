const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, email, confirmed_at, email_confirmed_at, raw_user_meta_data, raw_app_meta_data FROM auth.users');
    console.log('Auth Users:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying auth.users:', err.message);
  } finally {
    await client.end();
  }
}

run();
