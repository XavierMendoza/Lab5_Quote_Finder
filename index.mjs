import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "./views");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});

app.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [authors] = await conn.query(`
      SELECT authorId, firstName, lastName
      FROM q_authors
      ORDER BY lastName
    `);

    const [categories] = await conn.query(`
      SELECT DISTINCT category
      FROM q_quotes
      ORDER BY category
    `);

    conn.release();

    res.render("index", { authors, categories });

  } catch (err) {
    console.log(err);
    res.send("Error loading homepage");
  }
});

app.get("/searchByKeyword", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const keyword = `%${req.query.keyword}%`;

    const [rows] = await conn.query(`
      SELECT quote, firstName, lastName, authorId
      FROM q_quotes
      NATURAL JOIN q_authors
      WHERE quote LIKE ?
    `, [keyword]);

    conn.release();
    res.render("results", { quotes: rows });

  } catch (err) {
    console.log(err);
    res.send("Error searching keyword");
  }
});

app.get("/searchByAuthor", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(`
      SELECT quote, firstName, lastName, authorId
      FROM q_quotes
      NATURAL JOIN q_authors
      WHERE authorId = ?
    `, [req.query.authorId]);

    conn.release();
    res.render("results", { quotes: rows });

  } catch (err) {
    console.log(err);
    res.send("Error searching author");
  }
});

app.get("/searchByCategory", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(`
      SELECT quote, firstName, lastName, authorId
      FROM q_quotes
      NATURAL JOIN q_authors
      WHERE category = ?
    `, [req.query.category]);

    conn.release();
    res.render("results", { quotes: rows });

  } catch (err) {
    console.log(err);
    res.send("Error searching category");
  }
});

app.get("/searchByLikes", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(`
      SELECT quote, firstName, lastName, authorId, likes
      FROM q_quotes
      NATURAL JOIN q_authors
      WHERE likes BETWEEN ? AND ?
      ORDER BY likes DESC
    `, [req.query.minLikes, req.query.maxLikes]);

    conn.release();
    res.render("results", { quotes: rows });

  } catch (err) {
    console.log(err);
    res.send("Error searching likes");
  }
});

app.get("/api/author/:id", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(`
      SELECT *
      FROM q_authors
      WHERE authorId = ?
    `, [req.params.id]);

    conn.release();
    res.json(rows);

  } catch (err) {
    console.log(err);
    res.send("Error loading author API");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
