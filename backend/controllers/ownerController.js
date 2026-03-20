const pool = require("../config/db");

exports.branchSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id AS branch_id,
        b.name AS branch_name,

        COUNT(l.id) AS total_loans,

        COUNT(CASE WHEN l.status = 'active' THEN 1 END) AS active_loans,
        COUNT(CASE WHEN l.status = 'closed' THEN 1 END) AS closed_loans,
        COUNT(CASE WHEN l.status = 'renewed' THEN 1 END) AS renewed_loans,

        COALESCE(SUM(l.gold_weight), 0) AS total_gold_weight,

        COALESCE(SUM(
          CASE WHEN l.status = 'active' THEN l.principal_amount ELSE 0 END
        ), 0) AS total_outstanding_principal,

        COALESCE(SUM(p.interest_paid), 0) AS total_interest_collected

      FROM branches b
      LEFT JOIN loans l ON l.branch_id = b.id
      LEFT JOIN payments p ON p.loan_id = l.id
      GROUP BY b.id
      ORDER BY b.id
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.dailySummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id AS branch_id,
        b.name AS branch_name,

        COALESCE(SUM(p.amount_paid), 0) AS total_cash_collected,
        COALESCE(SUM(p.interest_paid), 0) AS total_interest_collected,
        COALESCE(SUM(p.principal_paid), 0) AS total_principal_collected,

        COUNT(CASE WHEN l.created_at::date = CURRENT_DATE THEN 1 END) AS loans_created_today,
        COUNT(CASE WHEN l.closed_at::date = CURRENT_DATE THEN 1 END) AS loans_closed_today

      FROM branches b
      LEFT JOIN loans l ON l.branch_id = b.id
      LEFT JOIN payments p ON p.loan_id = l.id
      AND p.payment_date::date = CURRENT_DATE

      GROUP BY b.id
      ORDER BY b.id
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const { runBackup } = require("../utils/backup");

exports.manualBackup = async (req, res) => {
  try {
    runBackup();
    res.json({ message: "Backup started" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

