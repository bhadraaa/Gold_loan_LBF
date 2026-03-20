const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, branch_id } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password, role, branch_id) VALUES ($1, $2, $3, 'staff', $4) RETURNING id, name, email, role, branch_id",
      [name, email, hashedPassword, branch_id]
    );

    res.json({
      message: "Staff created successfully",
      staff: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
