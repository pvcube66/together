const { Pool } = require("pg");

async function testPooler() {
  const connectionString = "postgresql://postgres.csidcoqfoyleeqkgahjf:15P13%40l23V92u@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";
  console.log("Testing connection to pooler:", connectionString);

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("Connected successfully!");
    const res = await client.query("SELECT 1;");
    console.log("Query Result:", res.rows);
    client.release();
  } catch (err) {
    console.error("Connection Failed:", err);
  } finally {
    await pool.end();
  }
}

testPooler();
