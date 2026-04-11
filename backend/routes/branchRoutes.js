const express = require("express");
const router = express.Router();
const { createBranch, getAllBranches } = require("../controllers/branchController");

router.get("/branches", getAllBranches);

router.post("/branches/create", createBranch);

module.exports = router;