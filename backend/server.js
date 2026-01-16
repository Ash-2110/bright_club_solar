// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Create tables if not exist
async function initDb() {
  // Customer Sites table – image-only or minimal info
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_sites (
      id SERIAL PRIMARY KEY,
      title TEXT,
      location TEXT,
      image_url TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Projects table – full details
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      image_url TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log("customer_sites & projects tables ready");
}

initDb().catch((err) => {
  console.error("Error initialising DB:", err);
  process.exit(1);
});

// Healthcheck
app.get("/", (req, res) => {
  res.send("Bright Club backend is running.");
});

/* ===================== CUSTOMER SITES API ===================== */

// GET /api/customer-sites - list all customer sites
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

// POST /api/customer-sites - add new customer site
// Body: { image_url, title?, location?, description? }
app.post("/api/customer-sites", async (req, res) => {
  try {
    const { image_url, title, location, description } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: "image_url is required" });
    }

    const result = await pool.query(
      `INSERT INTO customer_sites (image_url, title, location, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, location, image_url, description, created_at`,
      [image_url, title || null, location || null, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating customer site:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/customer-sites/:id
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

/* ======================== PROJECTS API ======================== */

// GET /api/projects - list all projects
app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, location, image_url, description, created_at FROM projects ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/projects - add new project
// Body: { title, location, image_url, description? }
app.post("/api/projects", async (req, res) => {
  try {
    const { title, location, image_url, description } = req.body;
    if (!title || !location || !image_url) {
      return res
        .status(400)
        .json({ error: "title, location and image_url are required" });
    }

    const result = await pool.query(
      `INSERT INTO projects (title, location, image_url, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, location, image_url, description, created_at`,
      [title, location, image_url, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/projects/:id
app.delete("/api/projects/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM projects WHERE id = $1", [id]);
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================= */

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});