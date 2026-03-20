const pool = require("../config/db");

exports.closeLoan = async (req, res) => {
  try {
    const { loan_id, amount_paid } = req.body;

    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Only staff can close loans" });
    }

    await pool.query("BEGIN");

    const loanResult = await pool.query(
      "SELECT * FROM loans WHERE id = $1",
      [loan_id]
    );

    if (loanResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "Loan not found" });
    }

    const loan = loanResult.rows[0];

    if (loan.status !== "active") {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Loan not active" });
    }

    // 🔹 Get total principal
    const principalResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM loan_disbursements
       WHERE loan_id = $1`,
      [loan_id]
    );

    const totalPrincipal = parseFloat(principalResult.rows[0].total);

    // 🔹 Get total principal already paid
    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(principal_paid),0) as total
       FROM payments
       WHERE loan_id = $1`,
      [loan_id]
    );

    const principalPaidAlready = parseFloat(paidResult.rows[0].total);

    let remainingPrincipal = parseFloat(
      (totalPrincipal - principalPaidAlready).toFixed(2)
    );

    if (remainingPrincipal <= 0.01) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Loan already fully paid" });
    }

    // 🔹 Get interest rate
    const rate = parseFloat(loan.interest_rate || 0);

    // 🔹 Get last payment date
    const lastPaymentResult = await pool.query(
      `SELECT created_at FROM payments
       WHERE loan_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [loan_id]
    );

    const fromDate = lastPaymentResult.rows.length
      ? new Date(lastPaymentResult.rows[0].created_at)
      : new Date(loan.created_at);

    const today = new Date();

    const diffDays = Math.ceil(
      (today - fromDate) / (1000 * 60 * 60 * 24)
    );

    // 🔹 Calculate live interest only on remaining principal
    let interestDue =
      (remainingPrincipal * rate * diffDays) / 36500;

    interestDue = parseFloat(interestDue.toFixed(2));

    const totalPayable = parseFloat(
      (remainingPrincipal + interestDue).toFixed(2)
    );

    if (amount_paid < totalPayable) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        message: "Insufficient payment",
        totalPayable
      });
    }

    // 🔹 Insert final payment
    await pool.query(
      `INSERT INTO payments
       (loan_id, amount_paid, interest_paid, principal_paid, received_by)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        loan_id,
        totalPayable,
        interestDue,
        remainingPrincipal,
        req.user.id
      ]
    );

    // 🔹 Close loan
    await pool.query(
      `UPDATE loans
       SET status = 'closed',
           closed_at = NOW()
       WHERE id = $1`,
      [loan_id]
    );

    await pool.query("COMMIT");

    res.json({
      message: "Loan closed successfully",
      interestPaid: interestDue,
      principalPaid: remainingPrincipal,
      totalPayable
    });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Close Loan Error:", err);
    res.status(500).json({ error: err.message });
  }
};





exports.partialPayment = async (req, res) => {
  try {
    const { loan_id, amount_paid } = req.body;

    if (!amount_paid || Number(amount_paid) <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Only staff can accept payments" });
    }

    await pool.query("BEGIN");

    const loanResult = await pool.query(
      `SELECT id, interest_rate, created_at, status
       FROM loans WHERE id = $1`,
      [loan_id]
    );

    if (loanResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "Loan not found" });
    }

    const loan = loanResult.rows[0];

    if (loan.status !== "active") {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Loan is not active" });
    }

    // 🔹 Get total principal
    const principalResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM loan_disbursements
       WHERE loan_id = $1`,
      [loan_id]
    );

    const totalPrincipal = parseFloat(principalResult.rows[0].total);

    // 🔹 Get total principal already paid
    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(principal_paid),0) as total
       FROM payments
       WHERE loan_id = $1`,
      [loan_id]
    );

    const principalPaid = parseFloat(paidResult.rows[0].total);

    let remainingPrincipal = parseFloat(
      (totalPrincipal - principalPaid).toFixed(2)
    );

    if (remainingPrincipal <= 0.01) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Loan already fully paid" });
    }

    // 🔹 Get last payment date
    const lastPaymentResult = await pool.query(
      `SELECT created_at FROM payments
       WHERE loan_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [loan_id]
    );

    const fromDate = lastPaymentResult.rows.length
      ? new Date(lastPaymentResult.rows[0].created_at)
      : new Date(loan.created_at);

    const today = new Date();

    const diffDays = Math.ceil(
      (today - fromDate) / (1000 * 60 * 60 * 24)
    );

    // 🔹 Calculate interest only on remaining principal
    let liveInterest =
      (remainingPrincipal * loan.interest_rate * diffDays) / 36500;

    liveInterest = parseFloat(liveInterest.toFixed(2));

    let payment = parseFloat(amount_paid);
    let interestPaid = 0;
    let principalPaidNow = 0;

    // 🔹 Deduct interest first
    if (payment >= liveInterest) {
      interestPaid = liveInterest;
      payment -= liveInterest;
      principalPaidNow = Math.min(payment, remainingPrincipal);
    } else {
      interestPaid = payment;
      principalPaidNow = 0;
    }

    interestPaid = parseFloat(interestPaid.toFixed(2));
    principalPaidNow = parseFloat(principalPaidNow.toFixed(2));

    const newRemainingPrincipal = parseFloat(
      (remainingPrincipal - principalPaidNow).toFixed(2)
    );

    // 🔹 Insert payment
    await pool.query(
      `INSERT INTO payments
       (loan_id, amount_paid, interest_paid, principal_paid, received_by)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        loan_id,
        interestPaid + principalPaidNow,
        interestPaid,
        principalPaidNow,
        req.user.id
      ]
    );

    // 🔹 Close loan if fully paid
    if (newRemainingPrincipal <= 0.01) {
      await pool.query(
        `UPDATE loans SET status = 'closed', closed_at = NOW()
         WHERE id = $1`,
        [loan_id]
      );
    }

    await pool.query("COMMIT");

    res.json({
      message: "Payment recorded",
      interestPaid,
      principalPaid: principalPaidNow,
      remainingPrincipal: newRemainingPrincipal,
      days: diffDays
    });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Partial Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};
