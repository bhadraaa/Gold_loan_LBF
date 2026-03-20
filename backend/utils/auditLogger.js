const pool = require("../config/db");

const logActivity = async ({
  userId,
  action,
  loanId = null,
  branchId = null
}) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs
       (user_id, action, loan_id, branch_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, action, loanId, branchId]
    );
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

module.exports = logActivity;
