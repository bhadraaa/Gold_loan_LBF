const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");
const app = express();

app.use(cors());
app.use(express.json());

const helmet = require("helmet");
app.use(helmet());

// ✅ Routes FIRST
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/branchRoutes"));
app.use("/api/loans", require("./routes/loanRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/owner", require("./routes/ownerRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));


// 🔁 Cron (keep before listen)
const cron = require("node-cron");
const { exec } = require("child_process");

cron.schedule("0 2 * * *", () => {
  exec(
    `"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe" -U postgres gold_loan_db > backup.sql`,
    (err) => {
      if (err) console.log("Backup failed");
      else console.log("Backup successful");
    }
  );
});

// ✅ START SERVER LAST
app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});

app.get("/api/test", (req, res) => {
  res.send("Backend working ✅");
});

app.get("/api/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(err.message);
  }
});