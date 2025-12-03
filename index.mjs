import express from "express";
import mysql from "mysql2/promise";

const app = express();

// Static folder
app.use(express.static("public"));

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", "./views");


const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "root",               
  database: "quoteFinder",
  connectionLimit: 10,
  waitForConnections: true
});



app.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Authors for dropdown
    const [authors] = await conn.query(
      `SELECT authorId, firstName, lastName
       FROM q_authors
       ORDER BY lastName`
    );

    // Categories for dropdown
    const [categories] = await conn.query(
      `SELECT DISTINCT category
       FROM q_quotes
       ORDER BY category`
    );

    conn.release();

    res.render("index", {
      authors: authors,
      categories: categories
    });

  } catch (err) {
    console.log(err);
    res.send("Error loading homepage");
  }
});



app.get("/searchByKeyword", async (req, res) => {
  let keyword = req.query.keyword;

  const sql = `
    SELECT quote, firstName, lastName, authorId
    FROM q_quotes
    NATURAL JOIN q_authors
    WHERE quote LIKE ?
  `;

  const params = [`%${keyword}%`];

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(sql, params);
    conn.release();

    res.render("results", { quotes: rows });

  } catch (err) {
    console.log(err);
    res.send("Error searching by keyword");
  }
});



app.get("/searchByAuthor", async (req, res) => {
  let authorId = req.query.authorId;

  const sql = `
    SELECT quote, firstName, lastName, authorId
    FROM q_quotes
    NATURAL JOIN q_authors
    WHERE authorId = ?
  `;

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(sql, [authorId]);
    conn.release();

    res.render("results", { quotes: rows });

  } catch (err) {
    console.log(err);
    res.send("Error searching by author");
  }
});



app.get("/searchByCategory", async (req, res) => {
  let category = req.query.category;

  const sql = `
    SELECT quote, firstName, lastName, authorId
    FROM q_quotes
    NATURAL JOIN q_authors
    WHERE category = ?
  `;

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(sql, [category]);
    conn.release();

    res.render("results", { quotes: rows });

  } catch (err) {
    console.log(err);
    res.send("Error searching by category");
  }
});



app.get("/searchByLikes", async (req, res) => {
  let minLikes = req.query.minLikes;
  let maxLikes = req.query.maxLikes;

  const sql = `
    SELECT quote, firstName, lastName, authorId, likes
    FROM q_quotes
    NATURAL JOIN q_authors
    WHERE likes BETWEEN ? AND ?
    ORDER BY likes DESC
  `;

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(sql, [minLikes, maxLikes]);
    conn.release();

    res.render("results", { quotes: rows });

  } catch (err) {
    console.log(err);
    res.send("Error searching by likes");
  }
});



app.get("/api/author/:id", async (req, res) => {
  let authorId = req.params.id;

  const sql = `
    SELECT *
    FROM q_authors
    WHERE authorId = ?
  `;

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(sql, [authorId]);
    conn.release();

    res.json(rows);

  } catch (err) {
    console.log(err);
    res.send("Error retrieving author info");
  }
});



app.get("/dbTest", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT CURDATE()");
    conn.release();

    res.send(rows);
  } catch (err) {
    console.log(err);
    res.send("Database connection failed");
  }
});



app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
