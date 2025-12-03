import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------
// DATABASE CONNECTION (LOCAL + HEROKU)
// -----------------------------------------
let pool;

if (process.env.JAWSDB_URL) {
  pool = mysql.createPool(process.env.JAWSDB_URL); // Heroku JawsDB
  console.log("Connected to Heroku JawsDB");
} else {
  pool = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "quoteFinder",
    connectionLimit: 10
  });
  console.log("Connected to LOCAL MySQL");
}

// -----------------------------------------
// ROUTES
// -----------------------------------------

// Home Page with search forms
app.get("/", async (req, res) => {
  const authors = await pool.query("SELECT authorId, firstName, lastName FROM authors ORDER BY lastName");
  const categories = await pool.query("SELECT DISTINCT category FROM quotes ORDER BY category");

  res.render("index", {
    authors: authors[0],
    categories: categories[0]
  });
});

// Search by Keyword
app.get("/searchByKeyword", async (req, res) => {
  const keyword = `%${req.query.keyword}%`;

  const sql = `
    SELECT q.quoteId, q.quote, q.category, q.likes,
           a.authorId, a.firstName, a.lastName
    FROM quotes q
    JOIN authors a ON q.authorId = a.authorId
    WHERE q.quote LIKE ?;
  `;

  const rows = await pool.query(sql, [keyword]);
  res.render("results", { quotes: rows[0] });
});

// Search by Author
app.get("/searchByAuthor", async (req, res) => {
  const authorId = req.query.authorId;

  const sql = `
    SELECT q.quoteId, q.quote, q.category, q.likes,
           a.authorId, a.firstName, a.lastName
    FROM quotes q
    JOIN authors a ON q.authorId = a.authorId
    WHERE a.authorId = ?;
  `;

  const rows = await pool.query(sql, [authorId]);
  res.render("results", { quotes: rows[0] });
});

// Search by Category
app.get("/searchByCategory", async (req, res) => {
  const category = req.query.category;

  const sql = `
    SELECT q.quoteId, q.quote, q.category, q.likes,
           a.authorId, a.firstName, a.lastName
    FROM quotes q
    JOIN authors a ON q.authorId = a.authorId
    WHERE q.category = ?;
  `;

  const rows = await pool.query(sql, [category]);
  res.render("results", { quotes: rows[0] });
});

// Search by Likes Range
app.get("/searchByLikes", async (req, res) => {
  const minLikes = req.query.minLikes || 0;
  const maxLikes = req.query.maxLikes || 99999;

  const sql = `
    SELECT q.quoteId, q.quote, q.category, q.likes,
           a.authorId, a.firstName, a.lastName
    FROM quotes q
    JOIN authors a ON q.authorId = a.authorId
    WHERE q.likes BETWEEN ? AND ?;
  `;

  const rows = await pool.query(sql, [minLikes, maxLikes]);
  res.render("results", { quotes: rows[0] });
});

// API: Get full author details (AJAX modal)
app.get("/author/:id", async (req, res) => {
  const authorId = req.params.id;

  const sql = `
    SELECT *
    FROM authors
    WHERE authorId = ?;
  `;

  const rows = await pool.query(sql, [authorId]);
  res.json(rows[0][0]);
});

// -----------------------------------------
// START SERVER
// -----------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
