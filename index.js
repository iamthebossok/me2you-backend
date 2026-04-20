const express = require("express");

const Stripe = require("stripe");

const sqlite3 = require("sqlite3").verbose();

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const app = express();

const PORT = process.env.PORT || 3000;

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || "");

const JWT_SECRET = process.env.JWT_SECRET || "change_me";

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

    <html>

      <body style="font-family:Arial;text-align:center;padding:40px">

        <h1>TheScripto</h1>

        <p>LIVE BACKEND ACTIVE</p>

      </body>

    </html>

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

// ================= GET POSTS =================

app.get("/api/posts", (req, res) => {

  db.all("SELECT * FROM posts ORDER BY createdAt DESC", [], (err, rows) => {

    res.json(rows || []);

  });

});

// ================= CREATE POST =================

app.post("/api/post", auth, (req, res) => {

  db.get(

    "SELECT balance FROM credits WHERE userId=?",

    [req.user.id],

    (err, row) => {

      if (!row || row.balance <= 0) {

        return res.status(403).send("No credits");

      }

      db.run(

        "INSERT INTO posts (userId,content,score) VALUES (?,?,?)",

        [req.user.id, req.body.content, req.body.score || 5]

      );

      db.run(

        "UPDATE credits SET balance = balance - 1 WHERE userId=?",

        [req.user.id]

      );

      res.json({ ok: true });

    }

  );

});

// ================= STRIPE PAYMENT (50p CREDIT) =================

app.post("/api/pay", auth, async (req, res) => {

  try {

    const session = await stripe.checkout.sessions.create({

      payment_method_types: ["card"],

      mode: "payment",

      line_items: [

        {

          price_data: {

            currency: "gbp",

            product_data: {

              name: "TheScripto Post Credit"

            },

            unit_amount: 50

          },

          quantity: 1

        }

      ],

      success_url: "https://example.com/success",

      cancel_url: "https://example.com/cancel"

    });

    res.json({ url: session.url });

  } catch (e) {

    res.status(500).send("Stripe error");

  }

});

// ================= START SERVER =================

app.listen(PORT, () => {

  console.log("TheScripto LIVE on port " + PORT);

});
