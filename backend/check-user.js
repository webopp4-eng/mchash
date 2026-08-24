const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  const res = await client.query(
    'SELECT id, email, role, "employeeStatus", "passwordHash", "authMethod" FROM "User" WHERE email = $1',
    ['qwerty7yh@gmail.com']
  );
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
