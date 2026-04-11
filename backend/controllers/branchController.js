const pool = require("../config/db");

// 🔹 Create Branch
exports.createBranch = async (req, res) => {
  try {
    const { name, location } = req.body;

    // ✅ Validation
    if (!name || !location) {
      return res.status(400).json({
        message: "Branch name and location are required"
      });
    }

    // ✅ Prevent duplicate branch names
    const existing = await pool.query(
      "SELECT * FROM branches WHERE LOWER(name) = LOWER($1)",
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Branch with this name already exists"
      });
    }

    const result = await pool.query(
      "INSERT INTO branches (name, location) VALUES ($1, $2) RETURNING *",
      [name.trim(), location.trim()]
    );

    res.json({
      message: "Branch created successfully",
      branch: result.rows[0]
    });

  } catch (err) {
    console.error("Create Branch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};


// 🔹 Get All Branches (for dropdown)

exports.getAllBranches = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM branches ORDER BY id ASC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Fetch Branches Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};