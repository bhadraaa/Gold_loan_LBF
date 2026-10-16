const pool = require("../config/db");
const logActivity = require("../utils/auditLogger");

/* ============================================================
   SHARED HELPERS
   ============================================================ */

class HttpError extends Error {
  constructor(status, body) {
    super(body && body.message ? body.message : "Request failed");
    this.status = status;
    this.body = body;
  }
}

// Sends the right response for an error thrown inside a handler.
function sendError(res, err, label) {
  if (err instanceof HttpError) {
    return res.status(err.status).json(err.body);
  }
  console.error(label, err);
  return res.status(500).json({ error: err.message });
}

// Runs fn(client) inside ONE dedicated connection so that BEGIN, every
// query and COMMIT/ROLLBACK are guaranteed to share the same transaction.
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback error:", rollbackError.message);
    }
    throw err;
  } finally {
    client.release();
  }
}

// Audit logging must never turn a committed transaction into an error
// response (the user could retry and create a duplicate payment).
async function safeLogActivity(payload) {
  try {
    await logActivity(payload);
  } catch (logError) {
    console.error("Activity log error:", logError.message);
  }
}

const round2 = (n) => Number(Number(n).toFixed(2));

function isBlank(value) {
  return value === undefined || value === null || value === "";
}

/* ============================================================
   INTEREST RATE HELPERS
   ============================================================ */

function getInterestRate(amount, customRate) {
  if (customRate !== undefined && customRate !== null && customRate !== "") {
    return parseFloat(customRate);
  }

  if (amount > 80000) {
    return 13;
  } else if (amount > 40000) {
    return 16;
  } else if (amount > 25000) {
    return 19;
  } else if (amount > 5000) {
    return 22;
  } else {
    return 24; // Loans of ₹5,000 or below
  }
}

function getUpdatedInterest(baseRate, monthsElapsed, amount) {
  baseRate = parseFloat(baseRate) || 0;
  monthsElapsed = Math.max(0, parseInt(monthsElapsed, 10) || 0);

  const increments = Math.floor(monthsElapsed / 6);

  return baseRate + increments * 3;
}

/* ============================================================
   SINGLE SOURCE OF TRUTH FOR INTEREST
   Used by: calculateInterest (preview), addPayment, renewLoan.

   Rules
   1. Interest accrues per day on the outstanding principal:
        interest = principal x rate x days / 36500
   2. The principal is tracked as a ledger. Every disbursement
      (initial loan and each top-up) starts earning interest on ITS
      OWN date, and every principal repayment stops earning interest
      on ITS OWN date.
   3. The rate is the base rate plus 3 points for every completed
      6 months since the loan date, and it applies to the ENTIRE
      duration (not only to the days after the 6-month mark).
   4. Interest already collected (payments.interest_paid) is
      subtracted, so nothing is ever charged twice.
   5. A minimum of one day of interest is charged.
   ============================================================ */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Whole calendar-day number (timezone/time-of-day safe).
function toDayNumber(value) {
  const d = new Date(value);
  return Math.floor(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY
  );
}

function completedMonthsBetween(startValue, endValue) {
  const start = new Date(startValue);
  const end = new Date(endValue);

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  if (end.getDate() < start.getDate()) {
    months--;
  }

  return Math.max(months, 0);
}

// db can be the pool or a transaction client.
async function getLoanLedger(db, loanId) {
  const disbursements = await db.query(
  `SELECT amount, disbursed_at
   FROM loan_disbursements
   WHERE loan_id = $1
   ORDER BY disbursed_at ASC`,
  [loanId]
);

  const payments = await db.query(
    `SELECT principal_paid, interest_paid, payment_date
     FROM payments
     WHERE loan_id = $1
     ORDER BY payment_date ASC`,
    [loanId]
  );

  return {
    disbursements: disbursements.rows,
    payments: payments.rows
  };
}

function computeLoanInterest(loan, ledger, asOf = new Date()) {
  const created = new Date(loan.created_at);

  if (Number.isNaN(created.getTime())) {
    throw new Error("Invalid loan creation date");
  }

  const startDay = toDayNumber(created);
  // Minimum one day of interest.
  const endDay = Math.max(toDayNumber(asOf), startDay + 1);

  const monthsElapsed = completedMonthsBetween(created, asOf);
  const rate = getUpdatedInterest(loan.interest_rate, monthsElapsed);

  // Build the principal ledger: +disbursements, -principal repayments.
  const events = [];

  ledger.disbursements.forEach((d, index) => {
    let day;

    if (index === 0) {
      // The first disbursement is the loan itself. It always starts on
      // the loan date (important for back-dated loans).
      day = startDay;
    } else {
      if (!d.disbursed_at) {
  throw new Error("Top-up disbursement is missing its date");
}

day = Math.min(
  Math.max(toDayNumber(d.disbursed_at), startDay),
  endDay
);
    }

    events.push({ day, delta: Number(d.amount) || 0 });
  });

  ledger.payments.forEach((p) => {
    if (!p.payment_date) {
      throw new Error("A payment on this loan is missing its payment date");
    }
    const day = Math.min(Math.max(toDayNumber(p.payment_date), startDay), endDay);
    events.push({ day, delta: -(Number(p.principal_paid) || 0) });
  });

  events.sort((a, b) => a.day - b.day);

  // Sum of (outstanding principal x days it was outstanding).
  let balance = 0;
  let cursor = startDay;
  let principalDays = 0;

  for (const event of events) {
    principalDays += balance * (event.day - cursor);
    balance += event.delta;
    cursor = event.day;
  }
  principalDays += balance * (endDay - cursor);

  const accruedInterest = round2((principalDays * rate) / 36500);

  const interestPaidTotal = round2(
    ledger.payments.reduce((s, p) => s + (Number(p.interest_paid) || 0), 0)
  );

  const interestDue = Math.max(round2(accruedInterest - interestPaidTotal), 0);

  const totalDisbursed = round2(
    ledger.disbursements.reduce((s, d) => s + (Number(d.amount) || 0), 0)
  );

  const principalPaidTotal = round2(
    ledger.payments.reduce((s, p) => s + (Number(p.principal_paid) || 0), 0)
  );

  const remainingPrincipal = Math.max(
    round2(totalDisbursed - principalPaidTotal),
    0
  );

  return {
    rate,
    monthsElapsed,
    days: endDay - startDay,
    accruedInterest,
    interestPaidTotal,
    interestDue,
    totalDisbursed,
    principalPaidTotal,
    remainingPrincipal
  };
}

exports.createLoan = async (req, res) => {
  try {
    const { customer_name, phone, address, items, loan_amount, loan_date } = req.body;
    const { custom_rate } = req.body;

    if (!customer_name || !items || !loan_amount) {
      return res.status(400).json({ message: "Customer name, items and loan amount are required" });
    }

    const loanNumber = String(req.body.loan_number ?? "").trim();

    if (!loanNumber) {
      return res.status(400).json({ message: "Loan number is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one gold item required" });
    }

   
    const loanAmount = Number(loan_amount);

    if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
      return res.status(400).json({ message: "Invalid loan amount" });
    }

    if (loan_date) {
      const parsedDate = new Date(loan_date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid loan date" });
      }

      if (parsedDate > new Date()) {
        return res.status(400).json({ message: "Loan date cannot be in future" });
      }
    }

    // Custom rate must be a real number inside the allowed range.
    // (parseFloat("abc") is NaN, and NaN passes every < / >= comparison.)
    let customRateValue = null;

    if (!isBlank(custom_rate)) {
      customRateValue = Number(custom_rate);

      if (!Number.isFinite(customRateValue)) {
        return res.status(400).json({ message: "Interest rate must be a valid number" });
      }

      if (customRateValue < 0 || customRateValue >= 60) {
        return res.status(400).json({ message: "Interest rate must be >= 0 and < 60" });
      }
    }

    // Calculate total gold weight
    const totalWeight = items.reduce(
      (sum, item) => sum + parseFloat(item.weight || 0), 0
    );

    if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
      return res.status(400).json({ message: "Invalid gold weight" });
    }

    const branch_id = req.activeBranchId;
    const created_by = req.user.id;
    const createdAt = loan_date ? new Date(loan_date) : new Date();

    const isSpecialLoan = loanAmount > 40000;
    const loan_type = isSpecialLoan ? "special" : "normal";

    const dynamicInterestRate = getInterestRate(loanAmount, customRateValue);

    const loan = await withTransaction(async (client) => {
      // Check duplicate loan number
      const dupCheck = await client.query(
        "SELECT id FROM loans WHERE loan_number = $1",
        [loanNumber]
      );
      if (dupCheck.rows.length > 0) {
        throw new HttpError(400, { message: "Loan number already exists" });
      }

      // Get latest gold rate (legacy check)
      const settingsResult = await client.query(
        "SELECT gold_rate FROM settings ORDER BY id DESC LIMIT 1"
      );
      if (settingsResult.rows.length === 0) {
        throw new HttpError(400, { message: "Gold rate not configured" });
      }

      // Get latest gold rate
      const goldRateResult = await client.query(
        `SELECT gold_rate FROM gold_rates ORDER BY effective_from DESC LIMIT 1`
      );
      if (goldRateResult.rows.length === 0) {
        throw new HttpError(400, { message: "Gold rate not set. Owner must set gold rate first." });
      }

      const goldRate = goldRateResult.rows[0].gold_rate;
      const eligibleAmount = totalWeight * goldRate;

      // Insert loan
      const loanResult = await client.query(
        `INSERT INTO loans
        (loan_number, customer_name, phone, address, items,
         gold_weight, eligible_amount, gold_rate_used, branch_id, created_by,
         loan_amount, interest_rate, loan_type, custom_interest_rate, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING *`,
        [
          loanNumber,
          customer_name,
          phone,
          address,
          JSON.stringify(items),
          totalWeight,
          eligibleAmount,
          goldRate,
          branch_id,
          created_by,
          loanAmount,
          dynamicInterestRate,
          loan_type,
          customRateValue,
          createdAt
        ]
      );

      const newLoan = loanResult.rows[0];

      // Insert disbursement (dated on the loan date, so back-dated
      // loans accrue interest from the right day)
      await client.query(
  `INSERT INTO loan_disbursements (loan_id, amount, disbursed_at)
   VALUES ($1, $2, $3)`,
  [newLoan.id, loanAmount, createdAt]
);

      return newLoan;
    });

    // Log only AFTER commit: the audit logger uses its own connection and
    // could not see the uncommitted loan row inside the transaction.
    await safeLogActivity({
      userId: req.user.id,
      action: `Created loan ${loanNumber}`,
      loanId: loan.id,
      branchId: branch_id
    });

    res.json({ message: "Loan created successfully", loan });

  } catch (err) {
    // Two requests with the same loan number at the same moment
    if (err.code === "23505" && /loan_number/.test(`${err.constraint || ""} ${err.detail || ""}`)) {
      return res.status(400).json({ message: "Loan number already exists" });
    }
    return sendError(res, err, "Create Loan Error:");
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

    if (req.user.role === "staff" || req.user.role === "owner") {
      sql += ` AND branch_id = $${params.length + 1}`;

      params.push(
        req.user.role === "staff"
          ? req.user.branch_id
          : req.activeBranchId
      );
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
      `SELECT
        l.*,
        b.name AS branch_name
      FROM loans l
      LEFT JOIN branches b ON b.id = l.branch_id
      WHERE l.id = $1`,
      [id]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const loan = loanResult.rows[0];

    if (req.user.role === "staff" && loan.branch_id !== req.user.branch_id) {
  return res.status(403).json({
    message: "Access denied: Loan belongs to another branch."
  });
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

    amount_paid = Number(amount_paid);
    payment_type = payment_type || "installment";

    if (!Number.isFinite(amount_paid) || amount_paid <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount"
      });
    }

    if (!["installment", "interest", "close"].includes(payment_type)) {
      return res.status(400).json({
        message: "Invalid payment type"
      });
    }

    amount_paid = round2(amount_paid);

    const outcome = await withTransaction(async (client) => {
      // 1. Fetch and lock the loan so two payments can't run at once
      const loanResult = await client.query(
        "SELECT * FROM loans WHERE id = $1 FOR UPDATE",
        [id]
      );

      if (loanResult.rows.length === 0) {
        throw new HttpError(404, { message: "Loan not found" });
      }

      const loan = loanResult.rows[0];

      if (loan.status !== "active") {
        throw new HttpError(400, {
          message: "Only active loans can receive payments"
        });
      }

      // 2. Interest + principal from the shared calculation
      const ledger = await getLoanLedger(client, id);
      const calc = computeLoanInterest(loan, ledger);

      if (calc.remainingPrincipal <= 0) {
        throw new HttpError(400, {
          message: "No outstanding principal remains"
        });
      }

      const interestDue = calc.interestDue;
      let remainingPrincipal = calc.remainingPrincipal;

      let interestPaid = 0;
      let principalPaid = 0;
      let closed = false;

      // 3. Apply payment
      if (payment_type === "interest") {
        interestPaid = Math.min(amount_paid, interestDue);
      } else if (payment_type === "installment") {
        interestPaid = Math.min(amount_paid, interestDue);

        const amountLeft = round2(amount_paid - interestPaid);

        principalPaid = Math.min(amountLeft, remainingPrincipal);
      } else if (payment_type === "close") {
        // Require enough money to settle interest and principal.
        const settlementAmount = round2(interestDue + remainingPrincipal);

        if (amount_paid + 0.001 < settlementAmount) {
          throw new HttpError(400, {
            message: "Insufficient amount to close the loan",
            interestDue,
            remainingPrincipal,
            settlementAmount
          });
        }

        interestPaid = interestDue;
        principalPaid = remainingPrincipal;
        closed = true;
      }

      interestPaid = round2(interestPaid);
      principalPaid = round2(principalPaid);

      remainingPrincipal = round2(
        Math.max(remainingPrincipal - principalPaid, 0)
      );

      // 4. Save payment
      await client.query(
        `INSERT INTO payments
         (loan_id, amount_paid, interest_paid, principal_paid,
          received_by, payment_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          round2(interestPaid + principalPaid),
          interestPaid,
          principalPaid,
          req.user.id,
          payment_type
        ]
      );

      // 5. Close loan if fully settled
      if (closed || remainingPrincipal <= 0.01) {
        await client.query(
          `UPDATE loans
           SET status = 'closed', closed_at = NOW()
           WHERE id = $1`,
          [id]
        );

        closed = true;
      }

      return {
        loan,
        interestRate: calc.rate,
        interestDue,
        interestPaid,
        principalPaid,
        remainingPrincipal,
        closed
      };
    });

    // 6. Record activity (after commit)
    await safeLogActivity({
      userId: req.user.id,
      action: `Payment (${payment_type}) on loan ${outcome.loan.loan_number} — ₹${(
        outcome.interestPaid + outcome.principalPaid
      ).toFixed(2)}`,
      loanId: outcome.loan.id,
      branchId: outcome.loan.branch_id
    });

    res.json({
      message: "Payment added successfully",
      interestRate: outcome.interestRate,
      interestDue: outcome.interestDue,
      interestPaid: outcome.interestPaid,
      principalPaid: outcome.principalPaid,
      remainingPrincipal: outcome.remainingPrincipal,
      closed: outcome.closed
    });

  } catch (err) {
    return sendError(res, err, "Payment error:");
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
    const new_loan_number = String(
      req.body.new_loan_number || ""
    ).trim();

    if (!new_loan_number) {
      return res.status(400).json({
        message: "New loan number is required"
      });
    }

    const result = await withTransaction(async (client) => {
      // 1. Fetch and lock old loan
      const loanResult = await client.query(
        `SELECT *
         FROM loans
         WHERE id = $1
         FOR UPDATE`,
        [id]
      );

      if (loanResult.rows.length === 0) {
        throw new HttpError(404, { message: "Loan not found" });
      }

      const oldLoan = loanResult.rows[0];

      if (oldLoan.status !== "active") {
        throw new HttpError(400, {
          message: "Only active loans can be renewed"
        });
      }

      // 2. Check duplicate loan number
      const dupCheck = await client.query(
        `SELECT id
         FROM loans
         WHERE loan_number = $1`,
        [new_loan_number]
      );

      if (dupCheck.rows.length > 0) {
        throw new HttpError(400, {
          message: "Loan number already exists"
        });
      }

      // 3. Principal + interest from the shared calculation
      //    (same numbers the loan screen and addPayment use)
      const ledger = await getLoanLedger(client, id);
      const calc = computeLoanInterest(oldLoan, ledger);

      if (calc.remainingPrincipal <= 0) {
        throw new HttpError(400, {
          message: "Loan fully paid. Cannot renew."
        });
      }

      const rate = calc.rate;
      const liveInterest = calc.interestDue;

      // 4. Capitalize interest
      const newPrincipal = round2(calc.remainingPrincipal + liveInterest);

      // 5. Mark old loan as renewed
      await client.query(
        `UPDATE loans
         SET status = 'renewed'
         WHERE id = $1`,
        [id]
      );

      // 6. Create new loan
      const newLoanResult = await client.query(
        `INSERT INTO loans
         (
           loan_number,
           customer_name,
           phone,
           address,
           items,
           gold_weight,
           eligible_amount,
           gold_rate_used,
           branch_id,
           created_by,
           parent_loan_id,
           interest_rate,
           loan_amount,
           loan_type
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7,
           $8, $9, $10, $11, $12, $13, $14
         )
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

      // 7. Add new principal as a disbursement (dated like the new loan)
      await client.query(
        `INSERT INTO loan_disbursements (loan_id, amount,  disbursed_at)
         VALUES ($1, $2, $3)`,
        [newLoan.id, newPrincipal, newLoan.created_at]
      );

      return { oldLoan, newLoan, calc, rate, liveInterest, newPrincipal };
    });

    // 8. Log activity after successful commit
    await safeLogActivity({
      userId: req.user.id,
      action:
        `Loan ${result.oldLoan.loan_number} renewed as ${new_loan_number}`,
      loanId: result.newLoan.id,
      branchId: result.oldLoan.branch_id
    });

    return res.json({
      message: "Loan renewed successfully",
      newLoan: result.newLoan,
      interestRate: result.rate,
      days: result.calc.days,
      monthsElapsed: result.calc.monthsElapsed,
      capitalizedInterest: result.liveInterest,
      newPrincipal: result.newPrincipal
    });

  } catch (err) {
    if (err.code === "23505" && /loan_number/.test(`${err.constraint || ""} ${err.detail || ""}`)) {
      return res.status(400).json({ message: "Loan number already exists" });
    }
    return sendError(res, err, "Renew Error:");
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
    if (!["staff", "owner"].includes(req.user.role)) {
  return res.status(403).json({
    message: "Access denied",
  });
}

    const branchId =
  req.user.role === "staff"
    ? req.user.branch_id
    : req.activeBranchId;

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
    if (!["staff", "owner"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const branchId =
  req.user.role === "staff"
    ? req.user.branch_id
    : req.activeBranchId;
    const { from, to } = req.query;

    // Default to today when dates are not supplied
    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    const fromDate = from || todayString;
    const toDate = to || todayString;

    // Validate date format
    const isValidDate = (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

    if (!isValidDate(fromDate) || !isValidDate(toDate)) {
      return res.status(400).json({
        message: "Invalid date. Use YYYY-MM-DD format."
      });
    }

    if (fromDate > toDate) {
      return res.status(400).json({
        message: "From date cannot be after To date."
      });
    }

    // Loans created within the selected date range
    const loans = await pool.query(
      `SELECT id, loan_number, customer_name, loan_amount, created_at
       FROM loans
       WHERE branch_id = $1
         AND created_at >= $2::date
         AND created_at < ($3::date + INTERVAL '1 day')
       ORDER BY created_at DESC`,
      [branchId, fromDate, toDate]
    );

    // Payments received within the selected date range
    const payments = await pool.query(
      `SELECT
         p.id,
         p.amount_paid,
         p.interest_paid,
         p.principal_paid,
         l.loan_number,
         p.payment_date
       FROM payments p
       JOIN loans l ON p.loan_id = l.id
       WHERE l.branch_id = $1
         AND p.payment_date >= $2::date
         AND p.payment_date < ($3::date + INTERVAL '1 day')
       ORDER BY p.payment_date DESC`,
      [branchId, fromDate, toDate]
    );

    // Financial totals for the same selected date range
    const totals = await pool.query(
      `SELECT
         COALESCE(SUM(p.amount_paid), 0) AS total_collection,
         COALESCE(SUM(p.interest_paid), 0) AS total_interest,
         COALESCE(SUM(p.principal_paid), 0) AS total_principal
       FROM payments p
       JOIN loans l ON p.loan_id = l.id
       WHERE l.branch_id = $1
         AND p.payment_date >= $2::date
         AND p.payment_date < ($3::date + INTERVAL '1 day')`,
      [branchId, fromDate, toDate]
    );

    res.json({
      fromDate,
      toDate,
      loans: loans.rows,
      payments: payments.rows,
      totalLoans: loans.rowCount,
      totalCollection: totals.rows[0].total_collection,
      totalInterest: totals.rows[0].total_interest,
      totalPrincipal: totals.rows[0].total_principal
    });

  } catch (err) {
    console.error("Staff Date Summary Error:", err);
    res.status(500).json({
      error: err.message
    });
  }
};



exports.ownerActivityLogs = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner allowed",
      });
    }

    const result = await pool.query(`
      SELECT
        a.id,
        a.user_id,
        a.action,
        a.loan_id,
        COALESCE(a.branch_id, l.branch_id) AS branch_id,
        b.name AS branch_name,
        u.name AS name,
        l.loan_number AS loan_number,
        a.created_at
      FROM activity_logs a
      JOIN users u
        ON a.user_id = u.id
      LEFT JOIN loans l
        ON a.loan_id = l.id
      LEFT JOIN branches b
        ON b.id = COALESCE(a.branch_id, l.branch_id)
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Owner Activity Logs Error:", err);
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
    const extraAmount = Number(req.body.extra_amount);

    if (!Number.isFinite(extraAmount) || extraAmount <= 0) {
      return res.status(400).json({
        message: "Invalid extra amount"
      });
    }

    await withTransaction(async (client) => {
      // Lock the loan so concurrent top-ups can't both pass the limit check
      const loanResult = await client.query(
        "SELECT * FROM loans WHERE id = $1 FOR UPDATE",
        [id]
      );

      if (loanResult.rows.length === 0) {
        throw new HttpError(404, { message: "Loan not found" });
      }

      const loan = loanResult.rows[0];

      if (loan.status !== "active") {
        throw new HttpError(400, { message: "Loan not active" });
      }

      // Get total already disbursed
      const totalResult = await client.query(
        `SELECT COALESCE(SUM(amount),0) as total
         FROM loan_disbursements
         WHERE loan_id = $1`,
        [id]
      );

      const currentPrincipal = Number(totalResult.rows[0].total);

      // Check eligible limit
      if (
        loan.loan_type !== "special" &&
        currentPrincipal + extraAmount > Number(loan.eligible_amount)
      ) {
        throw new HttpError(400, { message: "Exceeds eligible loan amount" });
      }

      // Insert top-up. The date is stored explicitly: interest on this
      // amount starts from THIS day, not from the original loan date.
      await client.query(
        `INSERT INTO loan_disbursements (loan_id, amount,  disbursed_at)
         VALUES ($1, $2, NOW())`,
        [id, round2(extraAmount)]
      );
    });

    res.json({
      message: "Top-up added successfully"
    });

  } catch (err) {
    return sendError(res, err, "Top-up error:");
  }
};



exports.calculateInterest = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch loan details
    const loanResult = await pool.query(
      `SELECT id, interest_rate, created_at, loan_amount
       FROM loans
       WHERE id = $1`,
      [id]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({
        message: "Loan not found"
      });
    }

    const loan = loanResult.rows[0];

    // 2. Same calculation that addPayment and renewLoan use
    const ledger = await getLoanLedger(pool, id);
    const calc = computeLoanInterest(loan, ledger);

    // 3. Return the result
    //    interest = what is actually due right now (accrued - already paid)
    res.json({
      remainingPrincipal: calc.remainingPrincipal,
      days: calc.days,
      monthsElapsed: calc.monthsElapsed,
      interestRate: calc.rate,
      accruedInterest: calc.accruedInterest,
      interestPaid: calc.interestPaidTotal,
      interest: calc.interestDue
    });

  } catch (err) {
    return sendError(res, err, "Interest Error:");
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