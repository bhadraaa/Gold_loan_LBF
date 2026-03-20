const express = require("express");
const router = express.Router();
const { authenticate, authorizeOwner } = require("../middleware/authMiddleware");
const { createBranch } = require("../controllers/branchController");

router.post("/create", authenticate, authorizeOwner, createBranch);

module.exports = router;
