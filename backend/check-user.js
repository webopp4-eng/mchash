const { Client } = require('pg');

const client = new Client({
  host: 'dpg-d9t7tdh42hec73fi3vtg-a.oregon-postgres.render.com',
  database: 'cmhast',
  user: 'cmhast_user',
  password: 'R3DvCyQyGFCzxiQI5z4i0VcQgNOb06RU',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  const res = await client.query(
    'SELECT id, email, role, "passwordHash", "authMethod" FROM "User" WHERE email = $1',
    ['qwerty7yh@gmail.com']
  );
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
