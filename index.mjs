import express from "express";
import mysql from "mysql2";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// Static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// DATABASE CONNECTION (Heroku uses env variable)
const db = mysql.createConnection(process.env.JAWSDB_URL);

db.connect((err) => {
  if (err) {
    console.error("DATABASE CONNECTION ERROR:", err);
  } else {
    console.log("Connected to MySQL (JawsDB)");
  }
});

// HOME PAGE
app.get("/", (req, res) => {
  res.render("index");
});

// SEARCH BY KEYWORD
app.get("/searchByKeyword", (req, res) => {
  let keyword = `%${req.query.keyword}%`;
  let sql = `
      SELECT q.quoteId, q.quote, a.firstName, a.lastName, q.authorId
      FROM q_quotes q
      JOIN q_authors a ON q.authorId = a.authorId
      WHERE q.quote LIKE ?;
  `;
  db.query(sql, [keyword], (err, rows) => {
    if (err) return res.send("Database error.");
    res.render("results", { quotes: rows });
  });
});

// SEARCH BY AUTHOR
app.get("/searchByAuthor", (req, res) => {
  let sql = `
      SELECT q.quoteId, q.quote, a.firstName, a.lastName, q.authorId
      FROM q_quotes q
      JOIN q_authors a ON q.authorId = a.authorId
      WHERE a.authorId = ?;
  `;
  db.query(sql, [req.query.authorId], (err, rows) => {
    if (err) return res.send("Database error.");
    res.render("results", { quotes: rows });
  });
});

// SEARCH BY CATEGORY
app.get("/searchByCategory", (req, res) => {
  let sql = `
      SELECT q.quoteId, q.quote, a.firstName, a.lastName, q.authorId
      FROM q_quotes q
      JOIN q_authors a ON q.authorId = a.authorId
      WHERE q.category = ?;
  `;
  db.query(sql, [req.query.category], (err, rows) => {
    if (err) return res.send("Database error.");
    res.render("results", { quotes: rows });
  });
});

// SEARCH BY LIKES RANGE
app.get("/searchByLikes", (req, res) => {
  let sql = `
      SELECT q.quoteId, q.quote, a.firstName, a.lastName, q.authorId
      FROM q_quotes q
      JOIN q_authors a ON q.authorId = a.authorId
      WHERE q.likes BETWEEN ? AND ?;
  `;

  db.query(
    sql,
    [req.query.minLikes, req.query.maxLikes],
    (err, rows) => {
      if (err) return res.send("Database error.");
      res.render("results", { quotes: rows });
    }
  );
});

// API FOR MODAL POPUP
app.get("/api/author/:id", (req, res) => {
  const sql = `SELECT * FROM q_authors WHERE authorId = ?`;
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
