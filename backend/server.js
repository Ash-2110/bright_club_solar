// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Create table if not exists
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_sites (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      image_url TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("customer_sites table ready");
}

initDb().catch((err) => {
  console.error("Error initialising DB:", err);
  process.exit(1);
});

// Healthcheck
app.get("/", (req, res) => {
  res.send("Bright Club backend is running.");
});

// List all customer sites
app.get("/api/customer-sites", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, location, image_url, description, created_at FROM customer_sites ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching customer sites:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add new customer site
// Body: { title, location, image_url, description }
app.post("/api/customer-sites", async (req, res) => {
  try {
    const { title, location, image_url, description } = req.body;
    if (!title || !location) {
      return res.status(400).json({ error: "title and location are required" });
    }

    const result = await pool.query(
      `INSERT INTO customer_sites (title, location, image_url, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, location, image_url, description, created_at`,
      [title, location, image_url || null, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating customer site:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a customer site
app.delete("/api/customer-sites/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM customer_sites WHERE id = $1", [id]);
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting customer site:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});