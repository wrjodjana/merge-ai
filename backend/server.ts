import pg from "pg";
import express from "express";
import cors from "cors";

const { Pool } = pg;

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
});

const app = express();
app.use(cors());

const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/pull_requests", async (req, res) => {
  try {
    const pull_requests = await pool.query("SELECT * FROM pull_requests;");
    return res.json(pull_requests.rows);
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch pull requests!" });
  }
});

app.listen(port, () => {
  console.log("Server is running!");
});
