
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");

const {
  resolveActiveBranch,
  ensureLoanBranchAccess,
} = require("../middleware/branchAccessMiddleware");

const {
  createLoan,
  searchLoans,
  getLoanById,
  addPayment,
  getLoanPayments,
  renewLoan,
  ownerSummary,
  branchSummary,
  ownerActivityLogs,
  exportBranchLoans,
  ownerDateReport,
  exportDateReport,
  financeSummary,
  staffTodaySummary,
  staffDateSummary,
  getTermOverLoans,
  addTopUp,
  calculateInterest,
  getRenewedLoan,
  getGoldRate,
  setGoldRate,
} = require("../controllers/loanController");

// ========================================
// OWNER REPORTS AND MANAGEMENT
// ========================================

router.get(
  "/owner/branch-summary",
  authenticate,
  branchSummary
);

router.get(
  "/owner/report/export",
  authenticate,
  exportDateReport
);

router.get(
  "/owner/report",
  authenticate,
  ownerDateReport
);

router.get(
  "/owner/finance-summary",
  authenticate,
  financeSummary
);

router.get(
  "/owner/summary",
  authenticate,
  ownerSummary
);

router.get(
  "/owner/activity",
  authenticate,
  ownerActivityLogs
);

router.get(
  "/owner/export/:branchId",
  authenticate,
  exportBranchLoans
);

router.post(
  "/owner/set-gold-rate",
  authenticate,
  setGoldRate
);

// ========================================
// BRANCH-SPECIFIC OPERATIONS
// Owner uses selected branch.
// Staff uses assigned branch.
// ========================================

router.post(
  "/create",
  authenticate,
  resolveActiveBranch,
  createLoan
);

router.get(
  "/staff/today-summary",
  authenticate,
  resolveActiveBranch,
  staffTodaySummary
);

router.get(
  "/staff/date-summary",
  authenticate,
  resolveActiveBranch,
  staffDateSummary
);

router.get(
  "/search",
  authenticate,
  resolveActiveBranch,
  searchLoans
);

router.get(
  "/term-over",
  authenticate,
  resolveActiveBranch,
  getTermOverLoans
);

router.get(
  "/gold-rate",
  authenticate,
  resolveActiveBranch,
  getGoldRate
);

// ========================================
// LOAN-SPECIFIC OPERATIONS
// Validate that the loan belongs to the
// active branch before accessing it.
// ========================================

router.get(
  "/:id/renewed-loan",
  authenticate,
  resolveActiveBranch,
  ensureLoanBranchAccess,
  getRenewedLoan
);

router.get(
  "/:id/payments",
  authenticate,
  resolveActiveBranch,
  ensureLoanBranchAccess,
  getLoanPayments
);

router.get(
  "/:id/interest",
  authenticate,
  resolveActiveBranch,
  ensureLoanBranchAccess,
  calculateInterest
);

router.post(
  "/:id/payment",
  authenticate,
  resolveActiveBranch,
  ensureLoanBranchAccess,
  addPayment
);

router.post(
  "/:id/renew",
  authenticate,
  resolveActiveBranch,
  ensureLoanBranchAccess,
  renewLoan
);

router.post(
  "/:id/topup",
  authenticate,
  resolveActiveBranch,
  ensureLoanBranchAccess,
  addTopUp
);

router.get(
  "/:id",
  authenticate,
  resolveActiveBranch,
  ensureLoanBranchAccess,
  getLoanById
);

module.exports = router;
