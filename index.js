const express = require("express");

const Stripe = require("stripe");

const sqlite3 = require("sqlite3").verbose();

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const app = express();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

app.use(express.json());

// ================= DATABASE =================

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

    balance INTEGER DEFAULT 0

  )`);

  db.run(`CREATE TABLE IF NOT EXISTS referrals (

    id INTEGER PRIMARY KEY,

    referrerId INTEGER,

    referredId INTEGER

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

// ================= REGISTER =================

app.post("/api/register", async (req, res) => {

  const hash = await bcrypt.hash(req.body.password, 10);

  db.run(

    "INSERT INTO users (username,password) VALUES (?,?)",

    [req.body.username, hash],

    function () {

      // give starter credit

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

// ================= STRIPE PAYMENT (£0.50 POST) =================

app.post("/api/pay", auth, async (req, res) => {

  const session = await stripe.checkout.sessions.create({

    payment_method_types: ["card"],

    mode: "payment",

    line_items: [{

      price_data: {

        currency: "gbp",

        product_data: {

          name: "TheScripto Experience Post"

        },

        unit_amount: 50

      },

      quantity: 1

    }],

    metadata: {

      userId: req.user.id

    },

    success_url: "https://yourdomain.com/success",

    cancel_url: "https://yourdomain.com/cancel"

  });

  res.json({ url: session.url });

});

// ================= CREATE EXPERIENCE =================

app.post("/api/post", auth, (req, res) => {

  const { content, score } = req.body;

  db.get(

    "SELECT balance FROM credits WHERE userId=?",

    [req.user.id],

    (err, row) => {

      if (!row || row.balance <= 0) {

        return res.status(403).send("No credits");

      }

      db.run(

        "INSERT INTO posts (userId,content,score) VALUES (?,?,?)",

        [req.user.id, content, score || 5]

      );

      db.run(

        "UPDATE credits SET balance = balance - 1 WHERE userId=?",

        [req.user.id]

      );

      res.json({ ok: true });

    }

  );

});

// ================= GET FEED =================

app.get("/api/posts", (req, res) => {

  db.all(

    "SELECT * FROM posts ORDER BY createdAt DESC",

    [],

    (err, rows) => {

      res.json(rows);

    }

  );

});

// ================= REFERRAL =================

app.post("/api/referral", auth, (req, res) => {

  const { referredUserId } = req.body;

  db.run(

    "INSERT INTO referrals (referrerId,referredId) VALUES (?,?)",

    [req.user.id, referredUserId]

  );

  db.run(

    "UPDATE credits SET balance = balance + 1 WHERE userId=?",

    [req.user.id]

  );

  res.json({ ok: true });

});

// ================= START =================

app.listen(PORT, () => {

  console.log("🚀 TheScripto LIVE");

});
