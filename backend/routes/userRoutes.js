const express = require("express");
const router = express.Router();
const { authenticate, authorizeOwner } = require("../middleware/authMiddleware");
const { createStaff } = require("../controllers/userController");

router.post("/create-staff", authenticate, authorizeOwner, createStaff);

module.exports = router;
