const pool = require("../config/db");
const logActivity = require("../utils/auditLogger");

function getInterestRate(amount, customRate) {
  if (customRate !== undefined && customRate !== null) return parseFloat(customRate);

  if (amount > 40000) {
    if (amount < 50000) return 18;
    if (amount < 60000) return 16;
    return 16;
  } else {
    if (amount < 5000) return 24;
    if (amount < 10000) return 24;
    if (amount < 25000) return 22;
    return 20;
  }
}

function getUpdatedInterest(baseRate, monthsElapsed, amount) {
  const isSpecial = amount > 40000;
  baseRate = parseFloat(baseRate) || 0;
  if (isSpecial) {
    const increments = Math.floor(monthsElapsed / 3);
    return baseRate + (increments * 3);
  } else {
    const increments = Math.floor(monthsElapsed / 6);
    return baseRate + (increments * 3);
  }
}

exports.createLoan = async (req, res) => {
  try {
    const { customer_name, phone, address, items, loan_amount, loan_date, loan_number } = req.body;

    if (!customer_name || !items || !loan_amount) {
      return res.status(400).json({ message: "Customer name, items and loan amount are required" });
    }

    if (!loan_number || loan_number.trim() === "") {
      return res.status(400).json({ message: "Loan number is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one gold item required" });
    }

    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Only staff can create loans" });
    }

    if (loan_date && new Date(loan_date) > new Date()) {
      return res.status(400).json({ message: "Loan date cannot be in future" });
    }

    const branch_id = req.user.branch_id;
    const created_by = req.user.id;
    const createdAt = loan_date ? new Date(loan_date) : new Date();

    await pool.query("BEGIN");

    // Check duplicate loan number
    const dupCheck = await pool.query(
      "SELECT id FROM loans WHERE loan_number = $1",
      [loan_number]
    );
    if (dupCheck.rows.length > 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Loan number already exists" });
    }

    // Get latest gold rate (legacy check)
    const settingsResult = await pool.query(
      "SELECT gold_rate FROM settings ORDER BY id DESC LIMIT 1"
    );
    if (settingsResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Gold rate not configured" });
    }

    // Get latest gold rate
    const goldRateResult = await pool.query(
      `SELECT gold_rate FROM gold_rates ORDER BY effective_from DESC LIMIT 1`
    );
    if (goldRateResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Gold rate not set. Owner must set gold rate first." });
    }

    const goldRate = goldRateResult.rows[0].gold_rate;

    // Calculate total gold weight
    const totalWeight = items.reduce(
      (sum, item) => sum + parseFloat(item.weight || 0), 0
    );

    if (totalWeight <= 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid gold weight" });
    }

    const eligibleAmount = totalWeight * goldRate;
    const isSpecialLoan = Number(loan_amount) > 40000;
    const loan_type = isSpecialLoan ? 'special' : 'normal';

    let { custom_rate } = req.body;

    if (custom_rate !== undefined && custom_rate !== null && custom_rate !== "") {
      const cr = parseFloat(custom_rate);
      if (cr < 0 || cr >= 60) {
        await pool.query("ROLLBACK");
        return res.status(400).json({ message: "Interest rate must be >= 0 and < 60" });
      }
    }

    const dynamicInterestRate = getInterestRate(
      Number(loan_amount),
      custom_rate !== "" ? custom_rate : null
    );

    // Insert loan
    const loanResult = await pool.query(
      `INSERT INTO loans
      (loan_number, customer_name, phone, address, items,
       gold_weight, eligible_amount, gold_rate_used, branch_id, created_by,
       loan_amount, interest_rate, loan_type, custom_interest_rate, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        loan_number,
        customer_name,
        phone,
        address,
        JSON.stringify(items),
        totalWeight,
        eligibleAmount,
        goldRate,
        branch_id,
        created_by,
        Number(loan_amount),
        dynamicInterestRate,
        loan_type,
        (custom_rate !== undefined && custom_rate !== null && custom_rate !== "")
          ? parseFloat(custom_rate) : null,
        createdAt
      ]
    );

    const loan = loanResult.rows[0];

    // Insert disbursement
    await pool.query(
      `INSERT INTO loan_disbursements (loan_id, amount) VALUES ($1, $2)`,
      [loan.id, Number(loan_amount)]
    );

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: `Created loan ${loan_number}`,
      loanId: loan.id,
      branchId: branch_id
    });

    await pool.query("COMMIT");

    res.json({ message: "Loan created successfully", loan });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Create Loan Error:", err);
    res.status(500).json({ error: err.message });
  }
};



exports.searchLoans = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    let sql = `
       SELECT id, loan_number, customer_name, phone,
              gold_weight, eligible_amount, loan_amount, status, loan_type
       FROM loans
       WHERE (customer_name ILIKE $1
          OR phone ILIKE $1
          OR loan_number::text ILIKE $1)
    `;
    const params = [`%${query}%`];

    if (req.user.role === 'staff') {
      sql += ` AND branch_id = $2`;
      params.push(req.user.branch_id);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await pool.query(sql, params);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



exports.getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    const loanResult = await pool.query(
      "SELECT * FROM loans WHERE id = $1",
      [id]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const loan = loanResult.rows[0];

    if (req.user.role === "staff" && loan.branch_id !== req.user.branch_id) {
      return res.status(403).json({ message: "Access denied: Loan belongs to another branch." });
    }

    // =============================
    // Total Principal (Disbursements)
    // =============================
    const principalResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM loan_disbursements
       WHERE loan_id = $1`,
      [id]
    );

    loan.total_principal =
      principalResult.rows[0]?.total || 0;

    // =============================
    // Total Paid
    // =============================
    const paidResult = await pool.query(
      `SELECT 
        COALESCE(SUM(amount_paid),0) as total_paid,
        COALESCE(SUM(interest_paid),0) as total_interest_paid
       FROM payments
       WHERE loan_id = $1`,
      [id]
    );

    loan.total_paid = paidResult.rows[0]?.total_paid || 0;
    loan.total_interest_paid =
      paidResult.rows[0]?.total_interest_paid || 0;

    // =============================
    // Payment History
    // =============================
    const payments = await pool.query(
      `SELECT * FROM payments
       WHERE loan_id = $1
       ORDER BY payment_date DESC`,
      [id]
    );
    // Check if this loan has child (renewed loan)
    const childLoan = await pool.query(
      `SELECT id FROM loans WHERE parent_loan_id = $1 LIMIT 1`,
      [id]
    );

    loan.child_loan_id = childLoan.rows[0]?.id || null;


    loan.payments = payments.rows;

    res.json(loan);

  } catch (err) {
    console.error("GetLoanById Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};




exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    let { amount_paid, payment_type } = req.body;

    amount_paid = parseFloat(amount_paid);
    payment_type = payment_type || "installment"; // default

    if (!amount_paid || amount_paid <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    if (!["installment", "interest", "close"].includes(payment_type)) {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    const loanResult = await pool.query(
      "SELECT * FROM loans WHERE id = $1", [id]
    );

    if (loanResult.rows.length === 0)
      return res.status(404).json({ message: "Loan not found" });

    const loan = loanResult.rows[0];

    if (loan.status === "closed")
      return res.status(400).json({ message: "Loan already closed" });

    // ── Get remaining principal ──
    const principalResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total FROM loan_disbursements WHERE loan_id = $1`, [id]
    );
    const totalPrincipal = parseFloat(principalResult.rows[0].total);

    const principalPaidResult = await pool.query(
      `SELECT COALESCE(SUM(principal_paid),0) as total FROM payments WHERE loan_id = $1`, [id]
    );
    const principalAlreadyPaid = parseFloat(principalPaidResult.rows[0].total);
    let remainingPrincipal = parseFloat((totalPrincipal - principalAlreadyPaid).toFixed(2));

    // ── Calculate interest due ──
    const today = new Date();
    const creationDate = new Date(loan.created_at);
    let monthsElapsed = (today.getFullYear() - creationDate.getFullYear()) * 12
      + (today.getMonth() - creationDate.getMonth());
    if (today.getDate() < creationDate.getDate()) monthsElapsed--;
    if (monthsElapsed < 0) monthsElapsed = 0;

    const interestRate = getUpdatedInterest(loan.interest_rate, monthsElapsed, loan.loan_amount);

    const lastPaymentResult = await pool.query(
      `SELECT created_at FROM payments WHERE loan_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]
    );
    const fromDate = lastPaymentResult.rows.length
      ? new Date(lastPaymentResult.rows[0].created_at)
      : new Date(loan.created_at);

    const diffDays = Math.ceil((today - fromDate) / (1000 * 60 * 60 * 24));
    let interestDue = parseFloat(
      ((remainingPrincipal * interestRate * diffDays) / 36500).toFixed(2)
    );

    let interestPaid = 0;
    let principalPaid = 0;
    let closed = false;

    // ── Apply payment based on type ──
    if (payment_type === "interest") {
      // Only pay interest — principal untouched
      interestPaid = Math.min(amount_paid, interestDue);
      principalPaid = 0;

    } else if (payment_type === "installment") {
      // Existing logic: interest first, then principal
      interestPaid = Math.min(amount_paid, interestDue);
      const remaining = amount_paid - interestPaid;
      principalPaid = Math.min(remaining, remainingPrincipal);

    } else if (payment_type === "close") {
      // Full settlement — clear everything
      interestPaid = Math.min(amount_paid, interestDue);
      const remaining = amount_paid - interestPaid;
      principalPaid = Math.min(remaining, remainingPrincipal);
      closed = true; // force close regardless
    }

    interestPaid = parseFloat(interestPaid.toFixed(2));
    principalPaid = parseFloat(principalPaid.toFixed(2));
    remainingPrincipal = parseFloat((remainingPrincipal - principalPaid).toFixed(2));

    // ── Insert payment record ──
    await pool.query(
      `INSERT INTO payments
       (loan_id, amount_paid, interest_paid, principal_paid, received_by, payment_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, interestPaid + principalPaid, interestPaid, principalPaid, req.user.id, payment_type]
    );

    // ── Close loan if needed ──
    if (closed || remainingPrincipal <= 0.01) {
      await pool.query(
        `UPDATE loans SET status = 'closed', closed_at = NOW() WHERE id = $1`, [id]
      );
      closed = true;
    }

    await logActivity({
      userId: req.user.id,
      action: `Payment (${payment_type}) on loan ${loan.loan_number} — ₹${interestPaid + principalPaid}`,
      loanId: loan.id,
      branchId: loan.branch_id
    });

    res.json({
      message: "Payment added successfully",
      interestPaid,
      principalPaid,
      remainingPrincipal,
      closed
    });

  } catch (err) {
    console.error("Payment error:", err.message);
    res.status(500).json({ error: err.message });
  }
};


exports.getLoanPayments = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM payments WHERE loan_id = $1 ORDER BY payment_date DESC",
      [id]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.renewLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_loan_number } = req.body;

    if (!new_loan_number || new_loan_number.trim() === "") {
      return res.status(400).json({ message: "New loan number is required" });
    }

    await pool.query("BEGIN");

    // Check duplicate newly assigned loan number
    const dupCheck = await pool.query(
      "SELECT id FROM loans WHERE loan_number = $1",
      [new_loan_number]
    );
    if (dupCheck.rows.length > 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "Loan number already exists" });
    }

    // 1️⃣ Get old loan
    const loanResult = await pool.query(
      `SELECT * FROM loans WHERE id = $1`,
      [id]
    );

    if (loanResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "Loan not found" });
    }

    const oldLoan = loanResult.rows[0];

    if (oldLoan.status !== "active") {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        message: "Only active loans can be renewed"
      });
    }

    // 2️⃣ Get total principal
    const principalResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM loan_disbursements
       WHERE loan_id = $1`,
      [id]
    );

    const totalPrincipal = Number(principalResult.rows[0].total);

    // 3️⃣ Get total principal paid
    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(principal_paid),0) as total
       FROM payments
       WHERE loan_id = $1`,
      [id]
    );

    const principalPaid = Number(paidResult.rows[0].total);

    const remainingPrincipal = Math.max(
      totalPrincipal - principalPaid,
      0
    );

    if (remainingPrincipal <= 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        message: "Loan fully paid. Cannot renew."
      });
    }

    // 4️⃣ Calculate live interest till today
    const startDate = new Date(oldLoan.created_at);
    const today = new Date();

    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    let diffDays = Math.floor(
      (today - startDate) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 1) diffDays = 1;

    let monthsElapsed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
    if (today.getDate() < startDate.getDate()) {
      monthsElapsed--;
    }
    if (monthsElapsed < 0) monthsElapsed = 0;

    const rate = getUpdatedInterest(oldLoan.interest_rate, monthsElapsed, oldLoan.loan_amount);

    const liveInterest =
      (remainingPrincipal * rate * diffDays) / 36500;

    // 5️⃣ Capitalize interest
    const newPrincipal = Math.round(
      remainingPrincipal + liveInterest
    );

    // 6️⃣ Mark old loan as renewed
    await pool.query(
      `UPDATE loans SET status = 'renewed'
       WHERE id = $1`,
      [id]
    );

    // 7️⃣ Create new loan using provided loan number
    const newLoanResult = await pool.query(
      `INSERT INTO loans
      (loan_number, customer_name, phone, address, items,
        gold_weight, eligible_amount,
        gold_rate_used, branch_id, created_by,
        parent_loan_id, interest_rate, loan_amount, loan_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        new_loan_number,
        oldLoan.customer_name,
        oldLoan.phone,
        oldLoan.address,
        JSON.stringify(oldLoan.items),
        oldLoan.gold_weight,
        oldLoan.eligible_amount,
        oldLoan.gold_rate_used,
        oldLoan.branch_id,
        req.user.id,
        oldLoan.id,
        rate,
        newPrincipal,
        oldLoan.loan_type
      ]
    );


    const newLoan = newLoanResult.rows[0];

    // 9️⃣ Insert new principal as disbursement
    await pool.query(
      `INSERT INTO loan_disbursements (loan_id, amount)
       VALUES ($1, $2)`,
      [newLoan.id, newPrincipal]
    );

    await pool.query("COMMIT");

    res.json({
      message: "Loan renewed successfully",
      newLoan,
      capitalizedInterest: Number(liveInterest.toFixed(2)),
      newPrincipal
    });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Renew Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getRenewedLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT id, loan_number FROM loans WHERE parent_loan_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No renewed loan found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Renewed Loan Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
};



exports.ownerSummary = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const activeLoans = await pool.query(
      "SELECT COUNT(*) FROM loans WHERE status = 'active'"
    );

    const totalGold = await pool.query(
      "SELECT SUM(gold_weight) FROM loans WHERE status = 'active'"
    );

    const totalOutstanding = await pool.query(
      "SELECT SUM(loan_amount) FROM loans WHERE status = 'active'"
    );

    const todayCollection = await pool.query(
      `SELECT SUM(amount_paid)
       FROM payments
       WHERE DATE(payment_date) = CURRENT_DATE`
    );

    res.json({
      activeLoans: activeLoans.rows[0].count || 0,
      totalGold: totalGold.rows[0].sum || 0,
      totalOutstanding: totalOutstanding.rows[0].sum || 0,
      todayCollection: todayCollection.rows[0].sum || 0
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.branchSummary = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const result = await pool.query(`
      SELECT 
        b.id,
        b.name,
        COUNT(l.id) FILTER (WHERE l.status = 'active') AS active_loans,
        COALESCE(SUM(l.gold_weight) FILTER (WHERE l.status = 'active'), 0) AS total_gold,
        COALESCE(SUM(l.loan_amount) FILTER (WHERE l.status = 'active'), 0) AS total_outstanding
      FROM branches b
      LEFT JOIN loans l ON b.id = l.branch_id
      GROUP BY b.id
      ORDER BY b.id
    `);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.exportBranchLoans = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const { branchId } = req.params;

    const result = await pool.query(
      `SELECT loan_number,
              customer_name,
              phone,
              gold_weight,
              loan_amount,
              status,
              created_at,
              closed_at
       FROM loans
       WHERE branch_id = $1
       ORDER BY created_at DESC`,
      [branchId]
    );

    const rows = result.rows;

    let csv = "Loan Number,Customer,Phone,Gold Weight,Loan Amount,Status,Created At,Closed At\n";

    rows.forEach((row) => {
      csv += `${row.loan_number},${row.customer_name},${row.phone},${row.gold_weight},${row.loan_amount},${row.status},${row.created_at},${row.closed_at || ""}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=branch-${branchId}-loans.csv`
    );

    res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.ownerDateReport = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const { from, to } = req.query;

    const result = await pool.query(
      `
      SELECT 
        l.loan_number,
        l.customer_name,
        l.phone,
        b.name AS branch,
        l.gold_weight,
        l.loan_amount,
        l.status,
        l.created_at,
        l.closed_at
      FROM loans l
      JOIN branches b ON l.branch_id = b.id
      WHERE DATE(l.created_at) BETWEEN $1 AND $2
      ORDER BY l.created_at DESC
      `,
      [from, to]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.exportDateReport = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const { from, to } = req.query;

    const result = await pool.query(
      `
      SELECT 
        l.loan_number,
        l.customer_name,
        l.phone,
        b.name AS branch,
        l.gold_weight,
        l.loan_amount,
        l.status,
        l.created_at,
        l.closed_at
      FROM loans l
      JOIN branches b ON l.branch_id = b.id
      WHERE DATE(l.created_at) BETWEEN $1 AND $2
      ORDER BY l.created_at DESC
      `,
      [from, to]
    );

    const rows = result.rows;

    let csv = "Loan Number,Customer,Phone,Branch,Gold Weight,Loan Amount,Status,Created At,Closed At\n";

    rows.forEach((row) => {
      csv += `${row.loan_number},${row.customer_name},${row.phone},${row.branch},${row.gold_weight},${row.loan_amount},${row.status},${row.created_at},${row.closed_at || ""}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${from}-to-${to}.csv`
    );

    res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.financeSummary = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const totalInterest = await pool.query(
      "SELECT COALESCE(SUM(interest_paid),0) FROM payments"
    );

    const todayInterest = await pool.query(
      `SELECT COALESCE(SUM(interest_paid),0)
       FROM payments
       WHERE DATE(payment_date) = CURRENT_DATE`
    );

    const monthlyInterest = await pool.query(
      `SELECT COALESCE(SUM(interest_paid),0)
       FROM payments
       WHERE DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    const totalCollection = await pool.query(
      "SELECT COALESCE(SUM(amount_paid),0) FROM payments"
    );

    res.json({
      totalInterest: totalInterest.rows[0].coalesce,
      todayInterest: todayInterest.rows[0].coalesce,
      monthlyInterest: monthlyInterest.rows[0].coalesce,
      totalCollection: totalCollection.rows[0].coalesce
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.staffTodaySummary = async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Only staff allowed" });
    }

    const branchId = req.user.branch_id;

    // Loans created today
    const loansToday = await pool.query(
      `SELECT id, loan_number, customer_name, loan_amount, created_at
       FROM loans
       WHERE branch_id = $1
       AND DATE(created_at) = CURRENT_DATE
       ORDER BY created_at DESC`,
      [branchId]
    );

    // Payments today
    const paymentsToday = await pool.query(
      `SELECT p.amount_paid, p.interest_paid, p.principal_paid,
              l.loan_number, p.payment_date
       FROM payments p
       JOIN loans l ON p.loan_id = l.id
       WHERE l.branch_id = $1
       AND DATE(p.payment_date) = CURRENT_DATE
       ORDER BY p.payment_date DESC`,
      [branchId]
    );

    const totalCollection = await pool.query(
      `SELECT COALESCE(SUM(amount_paid),0)
       FROM payments p
       JOIN loans l ON p.loan_id = l.id
       WHERE l.branch_id = $1
       AND DATE(p.payment_date) = CURRENT_DATE`,
      [branchId]
    );

    const totalInterest = await pool.query(
      `SELECT COALESCE(SUM(interest_paid),0)
       FROM payments p
       JOIN loans l ON p.loan_id = l.id
       WHERE l.branch_id = $1
       AND DATE(p.payment_date) = CURRENT_DATE`,
      [branchId]
    );

    const totalPrincipal = await pool.query(
      `SELECT COALESCE(SUM(principal_paid),0)
       FROM payments p
       JOIN loans l ON p.loan_id = l.id
       WHERE l.branch_id = $1
       AND DATE(p.payment_date) = CURRENT_DATE`,
      [branchId]
    );

    res.json({
      loansToday: loansToday.rows,
      paymentsToday: paymentsToday.rows,
      totalLoans: loansToday.rowCount,
      totalCollection: totalCollection.rows[0].coalesce,
      totalInterest: totalInterest.rows[0].coalesce,
      totalPrincipal: totalPrincipal.rows[0].coalesce
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.staffDateSummary = async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Only staff allowed" });
    }

    const branchId = req.user.branch_id;
    const { date } = req.query;

    const selectedDate = date || new Date().toISOString().split("T")[0];

    // Loans created on selected date
    const loans = await pool.query(
      `SELECT id, loan_number, customer_name, loan_amount, created_at
       FROM loans
       WHERE branch_id = $1
       AND DATE(created_at) = $2
       ORDER BY created_at DESC`,
      [branchId, selectedDate]
    );

    // Payments on selected date
    const payments = await pool.query(
      `SELECT p.amount_paid, p.interest_paid, p.principal_paid,
              l.loan_number, p.payment_date
       FROM payments p
       JOIN loans l ON p.loan_id = l.id
       WHERE l.branch_id = $1
       AND DATE(p.payment_date) = $2
       ORDER BY p.payment_date DESC`,
      [branchId, selectedDate]
    );

    const totals = await pool.query(
      `SELECT 
        COALESCE(SUM(amount_paid),0) as total_collection,
        COALESCE(SUM(interest_paid),0) as total_interest,
        COALESCE(SUM(principal_paid),0) as total_principal
       FROM payments p
       JOIN loans l ON p.loan_id = l.id
       WHERE l.branch_id = $1
       AND DATE(p.payment_date) = $2`,
      [branchId, selectedDate]
    );

    res.json({
      date: selectedDate,
      loans: loans.rows,
      payments: payments.rows,
      totalLoans: loans.rowCount,
      totalCollection: totals.rows[0].total_collection,
      totalInterest: totals.rows[0].total_interest,
      totalPrincipal: totals.rows[0].total_principal
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.ownerActivityLogs = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const result = await pool.query(
      `SELECT a.*, u.name
       FROM activity_logs a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 100`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getTermOverLoans = async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT *
       FROM loans
       WHERE status = 'active'
       AND created_at <= NOW() - INTERVAL '6 months'
       ORDER BY created_at ASC`
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.addTopUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { extra_amount } = req.body;

    if (!extra_amount || extra_amount <= 0) {
      return res.status(400).json({
        message: "Invalid extra amount"
      });
    }

    const loanResult = await pool.query(
      "SELECT * FROM loans WHERE id = $1",
      [id]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({
        message: "Loan not found"
      });
    }

    const loan = loanResult.rows[0];

    if (loan.status !== "active") {
      return res.status(400).json({
        message: "Loan not active"
      });
    }

    // Get total already disbursed
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM loan_disbursements
       WHERE loan_id = $1`,
      [id]
    );

    const currentPrincipal = Number(totalResult.rows[0].total);

    // Check eligible limit
    if (loan.loan_type !== 'special' && (currentPrincipal + Number(extra_amount) > loan.eligible_amount)) {
      return res.status(400).json({
        message: "Exceeds eligible loan amount"
      });
    }

    // Insert top-up
    await pool.query(
      `INSERT INTO loan_disbursements (loan_id, amount)
       VALUES ($1, $2)`,
      [id, extra_amount]
    );

    res.json({
      message: "Top-up added successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.calculateInterest = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch loan
    const loanResult = await pool.query(
      `SELECT id, interest_rate, created_at, loan_amount
       FROM loans
       WHERE id = $1`,
      [id]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const loan = loanResult.rows[0];

    console.log("Created At from DB:", loan.created_at);

    // Fetch total principal
    const principalResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) as total
       FROM loan_disbursements
       WHERE loan_id = $1`,
      [id]
    );

    const totalPrincipal = Number(principalResult.rows[0].total);

    // Fetch total principal paid
    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(principal_paid),0) as total
       FROM payments
       WHERE loan_id = $1`,
      [id]
    );

    const principalPaid = Number(paidResult.rows[0].total);

    const remainingPrincipal = Math.max(
      totalPrincipal - principalPaid,
      0
    );

    // Date calculation using created_at
    const startDate = new Date(loan.created_at);
    const today = new Date();

    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    let diffDays = Math.floor(
      (today - startDate) / (1000 * 60 * 60 * 24)
    );

    // Minimum 1 day rule (optional)
    if (diffDays < 1) diffDays = 1;

    let monthsElapsed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
    if (today.getDate() < startDate.getDate()) {
      monthsElapsed--;
    }
    if (monthsElapsed < 0) monthsElapsed = 0;

    // Interest calculation
    const rate = getUpdatedInterest(loan.interest_rate, monthsElapsed, loan.loan_amount);

    const interest =
      (remainingPrincipal * rate * diffDays) / 36500;

    res.json({
      remainingPrincipal,
      days: diffDays,
      interest: Number(interest.toFixed(2)),
    });

  } catch (err) {
    console.error("Interest Error:", err);
    res.status(500).json({ error: err.message });
  }
};




// Get Latest Gold Rate
exports.getGoldRate = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT gold_rate, effective_from
       FROM gold_rates
       ORDER BY effective_from DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No gold rate found"
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Get Gold Rate Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.setGoldRate = async (req, res) => {
  try {
    const { gold_rate } = req.body;

    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can update gold rate"
      });
    }

    if (!gold_rate || gold_rate <= 0) {
      return res.status(400).json({
        message: "Invalid gold rate"
      });
    }

    await pool.query(
      `INSERT INTO gold_rates (gold_rate)
       VALUES ($1)`,
      [gold_rate]
    );

    res.json({
      message: "Gold rate updated successfully"
    });

  } catch (err) {
    console.error("Set Gold Rate Error:", err);
    res.status(500).json({ error: err.message });
  }
};
