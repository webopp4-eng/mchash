const { Client } = require('pg');

const client = new Client({
  host: 'dpg-d9t7tdh42hec73fi3vtg-a.oregon-postgres.render.com',
  database: 'cmhast',
  user: 'cmhast_user',
  password: 'R3DvCyQyGFCzxiQI5z4i0VcQgNOb06RU',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

async function setupAdminAccount() {
  try {
    await client.connect();
    
    const hashedPassword = '$2b$10$eiUCRHorOuHEHd/sDiHr/eaLgCvmg4X0O0LLgkO3WBHGta.wdkwdG';
    const now = new Date().toISOString();
    
    // Update user with all required fields for email auth
    const result = await client.query(
      `UPDATE "User" SET 
        role = $1,
        "passwordHash" = $2,
        "authMethod" = $3,
        status = $4,
        "emailVerifiedAt" = $5,
        "fullName" = $6,
        username = $7,
        country = $8
       WHERE email = $9
       RETURNING id, email, role, "authMethod", status, "fullName"`,
      [
        'admin',                                    // role
        hashedPassword,                             // passwordHash
        'EMAIL',                                    // authMethod
        'active',                                   // status
        now,                                        // emailVerifiedAt
        'Admin User',                               // fullName
        'admin_user',                               // username
        'United States',                            // country
        'qwerty7yh@gmail.com'                       // email
      ]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✓ Admin account fully configured!');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Auth Method: ${user.authMethod}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Full Name: ${user.fullName}`);
      console.log('\n✓ Ready to login!');
    } else {
      console.log('✗ User not found');
    }
    
    await client.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
  }
}

setupAdminAccount();
