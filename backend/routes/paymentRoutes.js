
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const {
  resolveActiveBranch,
  ensureLoanBranchAccess,
} = require("../middleware/branchAccessMiddleware");

const {
  closeLoan,
  partialPayment,
} = require("../controllers/paymentController");

router.post(
  "/close-loan",
  authenticate,
  resolveActiveBranch,
  ensureLoanBranchAccess,
  closeLoan
);

router.post(
  "/partial-payment",
  authenticate,
  resolveActiveBranch,
  ensureLoanBranchAccess,
  partialPayment
);

module.exports = router;
