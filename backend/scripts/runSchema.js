const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('YOUR-PASSWORD')) {
  console.error('Error: Please fill in your real DATABASE_URL in backend/.env before running this script.');
  process.exit(1);
}

async function runSchema() {
  console.log('Connecting to PostgreSQL database...');
  
  // Since we're connecting to Supabase, we decode the URI
  // The pg client parser will decode %40 automatically.
  const client = new Client({
    connectionString: connectionString,
    // Add SSL support since Supabase requires SSL
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected successfully!');

    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database schema script...');
    await client.query(sql);
    console.log('Database schema executed successfully! All tables, RLS policies, triggers, and functions have been created.');

  } catch (error) {
    console.error('Error executing database schema:', error);
  } finally {
    await client.end();
  }
}

runSchema();
