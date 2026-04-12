const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");



exports.login = async (req, res) => {
  try {
    const { name, password, branch_id } = req.body;

    const nameCleaned = name ? name.trim().toLowerCase() : "";

    let user;

    if (branch_id) {
      // Staff login — must match name + branch
      user = await pool.query(
        "SELECT * FROM users WHERE LOWER(name) = $1 AND branch_id = $2 AND role = 'staff'",
        [nameCleaned, branch_id]
      );
    } else {
      // Owner login — no branch needed
      user = await pool.query(
        "SELECT * FROM users WHERE LOWER(name) = $1 AND role = 'owner'",
        [nameCleaned]
      );
    }

    if (user.rows.length === 0) {
      if (branch_id) {
        return res.status(400).json({ message: `Staff user '${name}' not found for this branch.` });
      } else {
        return res.status(400).json({ message: `Owner user '${name}' not found. Did you mean 'vasudevan_owner1'?` });
      }
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      {
        id: user.rows[0].id,
        role: user.rows[0].role,
        branch_id: user.rows[0].branch_id ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const dbUser = user.rows[0];
    let displayName = dbUser.calling_name || dbUser.full_name || dbUser.staff_name;

    if (!displayName) {
      // Smart Fallback: vasudevan_owner1 -> Vasudevan, staff_main -> Staff
      const rawName = dbUser.name || "";
      const firstPart = rawName.split('_')[0].replace(/[0-9]/g, '');
      displayName = firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
    }

    res.json({
      token,
      calling_name: displayName || "User"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};