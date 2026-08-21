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

    // Update user role to SUPER_ADMIN
    const result = await client.query(
      'UPDATE "User" SET role = $1, "employeeStatus" = $2 WHERE email = $3 RETURNING email, role, "employeeStatus"',
      ['SUPER_ADMIN', 'active', 'qwerty7yh@gmail.com']
    );

    if (result.rows.length > 0) {
      console.log('✓ Success! User made super admin:');
      console.log(`  Email: ${result.rows[0].email}`);
      console.log(`  Role: ${result.rows[0].role}`);
      console.log(`  Employee Status: ${result.rows[0].employeeStatus}`);
    } else {
      console.log('✗ User not found with that email');
    }

    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
  }
}

makeAdmin();