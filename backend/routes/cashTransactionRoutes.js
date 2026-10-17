
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");

const {
  createTransaction,
  getTransactions,
  getBranchStaff,
  getCashSummary,
} = require("../controllers/cashTransactionController");


router.get("/summary", authenticate, getCashSummary);
router.get("/staff", authenticate, getBranchStaff);
router.post("/", authenticate, createTransaction);
router.get("/", authenticate, getTransactions);

module.exports = router;
