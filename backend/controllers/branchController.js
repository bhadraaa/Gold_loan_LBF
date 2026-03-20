const pool = require("../config/db");

exports.createBranch = async (req, res) => {
  try {
    const { name, location } = req.body;

    const result = await pool.query(
      "INSERT INTO branches (name, location) VALUES ($1, $2) RETURNING *",
      [name, location]
    );

    res.json({ message: "Branch created", branch: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
