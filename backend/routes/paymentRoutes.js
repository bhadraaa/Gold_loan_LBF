const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { closeLoan, partialPayment } = require("../controllers/paymentController");


router.post("/close-loan", authenticate, closeLoan);
router.post("/partial-payment", authenticate, partialPayment);

module.exports = router;
