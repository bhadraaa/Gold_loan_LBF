const {Client} = require('pg');

async function testUsers() {
    const client = new Client('postgres://postgres:Bhadra@post@localhost:5432/gold_loan_db');
    await client.connect();
    
    // Check all owners
    let res = await client.query("SELECT id, name, role, branch_id FROM users WHERE role='owner'");
    console.log("Owners:", res.rows);

    let res2 = await client.query("SELECT id, name, role, branch_id FROM users");
    console.log("All:", res2.rows);

    await client.end();
}

testUsers().catch(console.error);
