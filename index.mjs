import express from "express";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Database connection (JawsDB MySQL)
const db = await mysql.createConnection({
  host: "uoa25ublaow4obx5.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "dksu6i3j9gcow18g",
  password: "dcoji93gtl2e2xac",
  database: "dizza5mrlepkcz3f"
});

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


// HOME PAGE
app.get("/", async (req, res) => {
  res.render("index", {
    authors: await getAuthors(),
    categories: await getCategories()
  });
});


// Author Search
app.get("/searchByAuthor", async (req, res) => {
  let sql = `
    SELECT q.quote, a.firstName, a.lastName, q.authorId
    FROM quotes q
      JOIN authors a ON q.authorId = a.authorId
    WHERE q.authorId = ?
  `;
  let rows = await db.execute(sql, [req.query.authorId]);
  res.render("results", { quotes: rows[0] });
});


// Keyword Search
app.get("/searchByKeyword", async (req, res) => {
  let keyword = `%${req.query.keyword}%`;
  let sql = `
    SELECT q.quote, a.firstName, a.lastName, q.authorId
    FROM quotes q
      JOIN authors a ON q.authorId = a.authorId
    WHERE q.quote LIKE ?
  `;
  let rows = await db.execute(sql, [keyword]);
  res.render("results", { quotes: rows[0] });
});


// Category Search
app.get("/searchByCategory", async (req, res) => {
  let sql = `
    SELECT q.quote, a.firstName, a.lastName, q.authorId
    FROM quotes q
      JOIN authors a ON q.authorId = a.authorId
    WHERE q.category = ?
  `;
  let rows = await db.execute(sql, [req.query.category]);
  res.render("results", { quotes: rows[0] });
});


// Likes Range
app.get("/searchByLikes", async (req, res) => {
  let sql = `
    SELECT q.quote, a.firstName, a.lastName, q.authorId
    FROM quotes q
      JOIN authors a ON q.authorId = a.authorId
    WHERE q.likes BETWEEN ? AND ?
  `;
  let rows = await db.execute(sql, [
    req.query.minLikes || 0,
    req.query.maxLikes || 999999
  ]);
  res.render("results", { quotes: rows[0] });
});


// API route used for modal window popup
app.get("/api/author/:id", async (req, res) => {
  let sql = `
    SELECT *
    FROM authors
    WHERE authorId = ?
  `;
  let rows = await db.execute(sql, [req.params.id]);
  res.json(rows[0]);
});


// Helper functions
async function getAuthors() {
  let sql = `SELECT * FROM authors ORDER BY lastName`;
  let rows = await db.execute(sql);
  return rows[0];
}

async function getCategories() {
  let sql = `SELECT DISTINCT category FROM quotes ORDER BY category`;
  let rows = await db.execute(sql);
  return rows[0];
}


// DEFAULT PORT FOR HEROKU
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});
