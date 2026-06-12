const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

console.log('Testing raw connection string:', connectionString);

// Let's parse the connection string manually
// format: postgresql://[user]:[password]@[host]:[port]/[database]
const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

if (match) {
  const [_, user, encodedPassword, host, port, database] = match;
  const decodedPassword = decodeURIComponent(encodedPassword);
  
  console.log('Manually Parsed Details:');
  console.log('Host:', host);
  console.log('Port:', port);
  console.log('User:', user);
  console.log('Database:', database);
  console.log('Password Length:', decodedPassword.length);
  console.log('Decoded Password:', decodedPassword);

  const client = new Client({
    host,
    port: parseInt(port),
    user,
    password: decodedPassword,
    database,
    ssl: {
      rejectUnauthorized: false
    }
  });

  client.connect()
    .then(() => {
      console.log('Connection SUCCESSFUL with manual parameters!');
      return client.end();
    })
    .catch((err) => {
      console.error('Connection FAILED with manual parameters:', err.message);
      
      // Let's try port 5432 (direct connection)
      console.log('\nTrying direct connection on port 5432...');
      const directHost = 'db.wqdfeqwnvlvztzpplpxn.supabase.co';
      const clientDirect = new Client({
        host: directHost,
        port: 5432,
        user: 'postgres',
        password: decodedPassword,
        database,
        ssl: {
          rejectUnauthorized: false
        }
      });
      
      return clientDirect.connect()
        .then(() => {
          console.log('Connection SUCCESSFUL on direct port 5432!');
          return clientDirect.end();
        })
        .catch((errDirect) => {
          console.error('Connection FAILED on direct port 5432:', errDirect.message);
        });
    });
} else {
  console.error('Failed to parse connection string format.');
}
