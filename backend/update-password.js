const { Client } = require('pg');

const client = new Client({
  host: 'dpg-d9t7tdh42hec73fi3vtg-a.oregon-postgres.render.com',
  database: 'cmhast',
  user: 'cmhast_user',
  password: 'R3DvCyQyGFCzxiQI5z4i0VcQgNOb06RU',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

async function updatePassword() {
  try {
    await client.connect();
    const hashedPassword = '$2b$10$eiUCRHorOuHEHd/sDiHr/eaLgCvmg4X0O0LLgkO3WBHGta.wdkwdG';
    
    const result = await client.query(
      'UPDATE "User" SET "passwordHash" = $1 WHERE email = $2 RETURNING email',
      [hashedPassword, 'qwerty7yh@gmail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✓ Password updated!');
      console.log(`  Email: ${result.rows[0].email}`);
    } else {
      console.log('✗ User not found');
    }
    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
  }
}

updatePassword();
