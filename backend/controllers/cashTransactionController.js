
const pool = require("../config/db");

// Create a cash transaction
exports.createTransaction = async (req, res) => {
  try {
    const { branch_id, transaction_type, amount, transaction_date, to_user_id, notes } =
      req.body;

    const userId = Number(req.user.id);
    const role = req.user.role;

    if (!["owner", "staff"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!["CASH_GIVEN", "CASH_RETURNED"].includes(transaction_type)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    // Owners record cash given; staff record cash returned.
    if (
      (role === "owner" && transaction_type !== "CASH_GIVEN") ||
      (role === "staff" && transaction_type !== "CASH_RETURNED")
    ) {
      return res.status(403).json({
        message: "You are not allowed to record this transaction type",
      });
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    // Resolve branch from the database for staff.
    // Owners must provide the branch they selected.
    let branchId;

    if (role === "staff") {
      const userResult = await pool.query(
        "SELECT branch_id FROM users WHERE id = $1 AND role = 'staff'",
        [userId]
      );

      if (!userResult.rows.length || !userResult.rows[0].branch_id) {
        return res.status(403).json({
          message: "No assigned branch found for this staff account",
        });
      }

      branchId = Number(userResult.rows[0].branch_id);
    } else {
      branchId = Number(branch_id);

      if (!Number.isInteger(branchId) || branchId <= 0) {
        return res.status(400).json({
          message: "A valid branch_id is required",
        });
      }
    }

    const branchResult = await pool.query(
      "SELECT id FROM branches WHERE id = $1",
      [branchId]
    );

    if (!branchResult.rows.length) {
      return res.status(400).json({ message: "Branch not found" });
    }

    // If a staff member is specified as the recipient, validate their branch.
    let recipientId = null;

    if (to_user_id !== undefined && to_user_id !== null && to_user_id !== "") {
      recipientId = Number(to_user_id);

      if (!Number.isInteger(recipientId) || recipientId <= 0) {
        return res.status(400).json({ message: "Invalid recipient user ID" });
      }

      const recipientResult = await pool.query(
        "SELECT id, role, branch_id FROM users WHERE id = $1",
        [recipientId]
      );

      if (!recipientResult.rows.length) {
        return res.status(400).json({ message: "Recipient not found" });
      }

      if (
        recipientResult.rows[0].role !== "staff" ||
        Number(recipientResult.rows[0].branch_id) !== branchId
      ) {
        return res.status(400).json({
          message: "Recipient must be staff assigned to this branch",
        });
      }
    }

    const fromUserId = userId;
    let toUserId = recipientId;

    if (transaction_type === "CASH_RETURNED") {
    const ownerResult = await pool.query(
        "SELECT id FROM users WHERE role = 'owner' ORDER BY id LIMIT 1"
    );

    if (!ownerResult.rows.length) {
        return res.status(400).json({ message: "Owner account not found" });
    }

    toUserId = Number(ownerResult.rows[0].id);
    }

    const result = await pool.query(
      `INSERT INTO cash_transactions
        (branch_id, transaction_type, amount, transaction_date,
         from_user_id, to_user_id, notes, created_by)
       VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE),
               $5, $6, $7, $8)
       RETURNING *`,
      [
        branchId,
        transaction_type,
        parsedAmount,
        transaction_date || null,
        fromUserId,
        toUserId,
        notes?.trim() || null,
        userId,
      ]
    );

    return res.status(201).json({
      message: "Cash transaction recorded successfully",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Create cash transaction error:", error);
    return res.status(500).json({
      message: "Failed to create cash transaction",
    });
  }
};

// View cash transaction history
exports.getTransactions = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const role = req.user.role;
    const { branch_id, start_date, end_date } = req.query;

    if (!["owner", "staff"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let conditions = [];
    let values = [];
    let paramIndex = 1;

    if (role === "staff") {
      const userResult = await pool.query(
        "SELECT branch_id FROM users WHERE id = $1 AND role = 'staff'",
        [userId]
      );

      if (!userResult.rows.length || !userResult.rows[0].branch_id) {
        return res.status(403).json({
          message: "No assigned branch found for this staff account",
        });
      }

      conditions.push(`ct.branch_id = $${paramIndex++}`);
      values.push(Number(userResult.rows[0].branch_id));
    } else if (branch_id) {
      const parsedBranchId = Number(branch_id);

      if (!Number.isInteger(parsedBranchId) || parsedBranchId <= 0) {
        return res.status(400).json({ message: "Invalid branch_id" });
      }

      conditions.push(`ct.branch_id = $${paramIndex++}`);
      values.push(parsedBranchId);
    }

    if (start_date) {
      conditions.push(`ct.transaction_date >= $${paramIndex++}::date`);
      values.push(start_date);
    }

    if (end_date) {
      conditions.push(`ct.transaction_date <= $${paramIndex++}::date`);
      values.push(end_date);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await pool.query(
      `SELECT
          ct.*,
          b.name AS branch_name,
          creator.name AS created_by_name,
          sender.name AS from_user_name,
          recipient.name AS to_user_name
       FROM cash_transactions ct
       JOIN branches b ON b.id = ct.branch_id
       JOIN users creator ON creator.id = ct.created_by
       LEFT JOIN users sender ON sender.id = ct.from_user_id
       LEFT JOIN users recipient ON recipient.id = ct.to_user_id
       ${whereClause}
       ORDER BY ct.transaction_date DESC, ct.created_at DESC`,
      values
    );

    return res.json({ transactions: result.rows });
  } catch (error) {
    console.error("Get cash transactions error:", error);
    return res.status(500).json({
      message: "Failed to fetch cash transactions",
    });
  }
};

exports.getBranchStaff = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = Number(req.user.id);
    let branchId;

    if (role === "owner") {
      branchId = Number(req.query.branch_id);

      if (!Number.isInteger(branchId) || branchId <= 0) {
        return res.status(400).json({
          message: "A valid branch_id is required",
        });
      }
    } else if (role === "staff") {
      const userResult = await pool.query(
        "SELECT branch_id FROM users WHERE id = $1 AND role = 'staff'",
        [userId]
      );

      if (!userResult.rows.length || !userResult.rows[0].branch_id) {
        return res.status(403).json({
          message: "No assigned branch found for this staff account",
        });
      }

      branchId = Number(userResult.rows[0].branch_id);
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await pool.query(
      `SELECT id, name, calling_name
       FROM users
       WHERE role = 'staff'
         AND branch_id = $1
       ORDER BY name ASC`,
      [branchId]
    );

    return res.json({ staff: result.rows });
  } catch (error) {
    console.error("Get branch staff error:", error);
    return res.status(500).json({
      message: "Failed to fetch branch staff",
    });
  }
};

exports.getCashSummary = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const role = req.user.role;
    const { branch_id } = req.query;

    if (!["owner", "staff"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let branchId = null;

    if (role === "staff") {
      const userResult = await pool.query(
        "SELECT branch_id FROM users WHERE id = $1 AND role = 'staff'",
        [userId]
      );

      if (
        !userResult.rows.length ||
        !userResult.rows[0].branch_id
      ) {
        return res.status(403).json({
          message: "No assigned branch found for this staff account",
        });
      }

      branchId = Number(userResult.rows[0].branch_id);
    } else if (branch_id !== undefined && branch_id !== "") {
      branchId = Number(branch_id);

      if (!Number.isInteger(branchId) || branchId <= 0) {
        return res.status(400).json({
          message: "Invalid branch_id",
        });
      }

      const branchResult = await pool.query(
        "SELECT id FROM branches WHERE id = $1",
        [branchId]
      );

      if (!branchResult.rows.length) {
        return res.status(404).json({ message: "Branch not found" });
      }
    }

    const values = [];
    let whereClause = "";

    if (branchId !== null) {
      values.push(branchId);
      whereClause = "WHERE branch_id = $1";
    }

    const result = await pool.query(
      `SELECT
         COALESCE(
           SUM(amount) FILTER (
             WHERE transaction_type = 'CASH_GIVEN'
           ), 0
         ) AS total_cash_given,

         COALESCE(
           SUM(amount) FILTER (
             WHERE transaction_type = 'CASH_RETURNED'
           ), 0
         ) AS total_cash_returned,

         COUNT(*) AS transaction_count
       FROM cash_transactions
       ${whereClause}`,
      values
    );

    const totalCashGiven = Number(result.rows[0].total_cash_given);
    const totalCashReturned = Number(result.rows[0].total_cash_returned);

    return res.json({
      branch_id: branchId,
      total_cash_given: totalCashGiven,
      total_cash_returned: totalCashReturned,
      outstanding_cash: totalCashGiven - totalCashReturned,
      transaction_count: Number(result.rows[0].transaction_count),
    });
  } catch (error) {
    console.error("Get cash summary error:", error);

    return res.status(500).json({
      message: "Failed to fetch cash summary",
    });
  }
};

