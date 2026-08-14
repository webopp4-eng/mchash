const { Client } = require('pg');

const client = new Client({
  host: 'dpg-d9t7tdh42hec73fi3vtg-a.oregon-postgres.render.com',
  database: 'cmhast',
  user: 'cmhast_user',
  password: 'R3DvCyQyGFCzxiQI5z4i0VcQgNOb06RU',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

async function makeAdmin() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Update user role to admin
    const result = await client.query(
      'UPDATE "User" SET role = $1 WHERE email = $2 RETURNING email, role',
      ['admin', 'qwerty7yh@gmail.com']
    );

    if (result.rows.length > 0) {
      console.log('✓ Success! User made admin:');
      console.log(`  Email: ${result.rows[0].email}`);
      console.log(`  Role: ${result.rows[0].role}`);
    } else {
      console.log('✗ User not found with that email');
    }

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
  }
}

makeAdmin();
