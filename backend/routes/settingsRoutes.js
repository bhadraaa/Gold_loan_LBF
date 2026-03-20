const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { getLatestSettings, updateGoldRate, getCurrentGoldRate, updateInterestRate } = require("../controllers/settingsController");

router.get("/latest", authenticate, getLatestSettings);
router.post(
  "/owner/set-gold-rate",
  authenticate,
  updateGoldRate
);
router.post(
  "/owner/set-interest-rate",
  authenticate,
  updateInterestRate
);
router.get(
  "/gold-rate",
  authenticate,
  getCurrentGoldRate
);

module.exports = router;
