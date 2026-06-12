const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database successfully!');

    // Let's insert a test profile if it doesn't exist
    const checkUser = await client.query("SELECT * FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000'");
    if (checkUser.rows.length === 0) {
      console.log('Inserting test profile...');
      await client.query(`
        INSERT INTO profiles (id, name, email, role)
        VALUES ('00000000-0000-0000-0000-000000000000', 'System Admin', 'system@necleap.com', 'super_admin')
      `);
      console.log('Test profile inserted.');
    } else {
      console.log('Test profile already exists:', checkUser.rows[0]);
    }
  } catch (err) {
    console.error('Database connection / query error:', err.message);
  } finally {
    await client.end();
  }
}

run();
