const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function updatePasswords() {
    const client = new Client('postgres://postgres:Bhadra@post@localhost:5432/gold_loan_db');
    await client.connect();
    const hash = await bcrypt.hash('admin123', 10);
    await client.query('UPDATE users SET password = $1', [hash]);
    console.log("Passwords successfully updated to admin123");
    await client.end();
}

updatePasswords().catch(console.error);
