const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: "localhost",
  database: "gold_loan_db",
  password: process.env.DB_PASS,
  port: 5432,
});

pool.connect()
  .then(() => console.log("Database connected"))
  .catch(err => console.error("DB connection error", err));

module.exports = pool;
