const {Client} = require('pg');

async function testQuery() {
    const client = new Client('postgres://postgres:Bhadra@post@localhost:5432/gold_loan_db');
    await client.connect();
    
    let nameCleaned = 'vasudevan_owner1';
    
    let res = await client.query("SELECT * FROM users WHERE LOWER(name) = $1 AND role = 'owner'", [nameCleaned]);
    console.log("Found:", res.rows.length);

    let res2 = await client.query("SELECT * FROM users WHERE name = 'vasudevan_owner1' AND role = 'owner'");
    console.log("Direct found:", res2.rows.length);
    
    await client.end();
}

testQuery().catch(console.error);
