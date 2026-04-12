const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");

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

router.post("/create", authenticate, createLoan);

// ✅ All specific routes first
router.get("/owner/branch-summary", authenticate, branchSummary);
router.get("/owner/report", authenticate, ownerDateReport);
router.get("/owner/report/export", authenticate, exportDateReport);
router.get("/owner/finance-summary", authenticate, financeSummary);
router.get("/owner/summary", authenticate, ownerSummary);
router.get("/owner/activity", authenticate, ownerActivityLogs);
router.get("/owner/export/:branchId", authenticate, exportBranchLoans);
router.post("/owner/set-gold-rate", authenticate, setGoldRate);

router.get("/staff/today-summary", authenticate, staffTodaySummary);
router.get("/staff/date-summary", authenticate, staffDateSummary);

router.get("/search", authenticate, searchLoans);
router.get("/gold-rate", authenticate, getGoldRate);
router.get("/term-over", authenticate, getTermOverLoans);

// ✅ Dynamic :id routes LAST
router.get("/:id/renewed-loan", authenticate, getRenewedLoan);
router.get("/:id", authenticate, getLoanById);
router.post("/:id/payment", authenticate, addPayment);
router.get("/:id/payments", authenticate, getLoanPayments);
router.post("/:id/renew", authenticate, renewLoan);
router.get("/:id/interest", authenticate, calculateInterest);
router.post("/:id/topup", authenticate, addTopUp);

module.exports = router;
