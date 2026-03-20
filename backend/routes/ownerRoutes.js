const express = require("express");
const router = express.Router();
const { authenticate, authorizeOwner } = require("../middleware/authMiddleware");
const { branchSummary, dailySummary, manualBackup } = require("../controllers/ownerController");


router.get("/branch-summary", authenticate, authorizeOwner, branchSummary);
router.get("/daily-summary", authenticate, authorizeOwner, dailySummary);
router.get("/backup-now", authenticate, authorizeOwner, manualBackup);

module.exports = router;
