const express = require("express");

const sqlite3 = require("sqlite3").verbose();

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const app = express();

const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

app.use(express.json());

// ================= DB =================

const db = new sqlite3.Database("./thescripto.db");

db.serialize(() => {

  db.run(`CREATE TABLE IF NOT EXISTS users (

    id INTEGER PRIMARY KEY,

    username TEXT UNIQUE,

    password TEXT

  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (

    id INTEGER PRIMARY KEY,

    userId INTEGER,

    content TEXT,

    score INTEGER,

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP

  )`);

  db.run(`CREATE TABLE IF NOT EXISTS credits (

    userId INTEGER,

    balance INTEGER DEFAULT 1

  )`);

});

// ================= AUTH =================

function auth(req, res, next) {

  const token = req.headers.authorization;

  if (!token) return res.status(403).send("No token");

  try {

    req.user = jwt.verify(token, JWT_SECRET);

    next();

  } catch {

    res.status(403).send("Invalid token");

  }

}

// ================= HOME =================

app.get("/", (req, res) => {

  res.send(`

    <h1>TheScripto</h1>

    <p>Server is running ✅</p>

  `);

});

// ================= REGISTER =================

app.post("/api/register", async (req, res) => {

  const hash = await bcrypt.hash(req.body.password, 10);

  db.run(

    "INSERT INTO users (username,password) VALUES (?,?)",

    [req.body.username, hash],

    function () {

      db.run("INSERT INTO credits (userId,balance) VALUES (?,1)", [this.lastID]);

      res.json({ ok: true });

    }

  );

});

// ================= LOGIN =================

app.post("/api/login", (req, res) => {

  db.get(

    "SELECT * FROM users WHERE username=?",

    [req.body.username],

    async (err, user) => {

      if (!user) return res.status(400).send("No user");

      const ok = await bcrypt.compare(req.body.password, user.password);

      if (!ok) return res.status(403).send("Wrong password");

      const token = jwt.sign({ id: user.id }, JWT_SECRET);

      res.json({ token });

    }

  );

});

// ================= POSTS =================

app.get("/api/posts", (req, res) => {

  db.all("SELECT * FROM posts ORDER BY createdAt DESC", [], (err, rows) => {

    res.json(rows || []);

  });

});

// ================= CREATE POST =================

app.post("/api/post", auth, (req, res) => {

  db.run(

    "INSERT INTO posts (userId,content,score) VALUES (?,?,?)",

    [req.user.id, req.body.content, req.body.score || 5]

  );

  res.json({ ok: true });

});

// ================= START =================

app.listen(PORT, () => {

  console.log("TheScripto running on port " + PORT);

});
