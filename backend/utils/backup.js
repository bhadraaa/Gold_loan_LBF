const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();

exports.runBackup = () => {
  const date = new Date().toISOString().split("T")[0];
  const filePath = path.join(__dirname, `../backups/backup-${date}.backup`);

  const pgDumpPath = "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe";

  const dump = spawn(pgDumpPath, [
    "-U", process.env.DB_USER,
    "-h", "localhost",
    "-F", "c",              // custom compressed format
    "-f", filePath,
    "gold_loan_db"
  ], {
    env: {
      ...process.env,
      PGPASSWORD: process.env.DB_PASS
    }
  });

  dump.on("close", (code) => {
    if (code === 0) {
      console.log("Backup successful:", filePath);
    } else {
      console.error("Backup failed with code:", code);
    }
  });

  dump.on("error", (err) => {
    console.error("Backup error:", err.message);
  });
};
