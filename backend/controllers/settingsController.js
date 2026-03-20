const pool = require("../config/db");

exports.getLatestSettings = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM settings ORDER BY id DESC LIMIT 1"
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No settings found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateGoldRate = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const { gold_rate } = req.body;

    if (!gold_rate || gold_rate <= 0) {
      return res.status(400).json({ message: "Invalid gold rate" });
    }

    const latest = await pool.query("SELECT interest_rate FROM settings ORDER BY id DESC LIMIT 1");
    const prevInterest = latest.rows.length > 0 ? latest.rows[0].interest_rate : 12;

    await pool.query(
      `INSERT INTO settings (gold_rate, interest_rate)
       VALUES ($1, $2)`,
      [gold_rate, prevInterest]
    );

    res.json({ message: "Gold rate updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInterestRate = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    const { interest_rate } = req.body;

    if (!interest_rate || interest_rate <= 0) {
      return res.status(400).json({ message: "Invalid interest rate" });
    }

    const latest = await pool.query("SELECT gold_rate FROM settings ORDER BY id DESC LIMIT 1");
    const prevGold = latest.rows.length > 0 ? latest.rows[0].gold_rate : 0;

    await pool.query(
      `INSERT INTO settings (gold_rate, interest_rate)
       VALUES ($1, $2)`,
      [prevGold, interest_rate]
    );

    res.json({ message: "Interest rate updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentGoldRate = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT gold_rate, effective_from FROM settings ORDER BY id DESC LIMIT 1"
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
