
const pool = require("../config/db");

// Resolve the branch for this operation without changing the user's role.
exports.resolveActiveBranch = async (req, res, next) => {
  try {
    let branchId;

    if (req.user.role === "staff") {
      branchId = req.user.branch_id;
    } else if (req.user.role === "owner") {
      branchId = req.headers["x-active-branch-id"];
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!branchId || !Number.isInteger(Number(branchId)) || Number(branchId) <= 0) {
      return res.status(400).json({
        message: "Select a valid branch before continuing",
      });
    }

    const result = await pool.query(
      "SELECT id FROM branches WHERE id = $1",
      [Number(branchId)]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Branch not found" });
    }

    req.activeBranchId = Number(branchId);
    next();
  } catch (err) {
    console.error("Resolve branch error:", err);
    res.status(500).json({ message: "Unable to validate branch" });
  }
};

// Ensure the loan belongs to the branch the user is allowed to operate in.
exports.ensureLoanBranchAccess = async (req, res, next) => {
  try {
    const loanId = req.params.id || req.body.loan_id;

    if (!loanId || !Number.isInteger(Number(loanId)) || Number(loanId) <= 0) {
      return res.status(400).json({ message: "Valid loan ID is required" });
    }

    const result = await pool.query(
      "SELECT id, branch_id FROM loans WHERE id = $1",
      [Number(loanId)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const loan = result.rows[0];

    if (Number(loan.branch_id) !== Number(req.activeBranchId)) {
      return res.status(403).json({
        message: "Access denied: loan belongs to another branch",
      });
    }

    req.loanBranchId = Number(loan.branch_id);
    next();
  } catch (err) {
    console.error("Loan branch access error:", err);
    res.status(500).json({ message: "Unable to validate loan access" });
  }
};
