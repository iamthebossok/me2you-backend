const express = require("express");

const Stripe = require("stripe");

const sqlite3 = require("sqlite3").verbose();

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const cors = require("cors");

const session = require("express-session");

const bodyParser = require("body-parser");

const app = express();

// =======================

// CONFIG

// =======================

const PORT = process.env.PORT || 3000;

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// =======================

// MIDDLEWARE

// =======================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(session({

  secret: "session_secret",

  resave: false,

  saveUninitialized: false

}));

// Stripe webhook MUST use raw body

app.post("/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {

  let event;

  try {

    const sig = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

  } catch (err) {

    return res.status(400).send(err.message);

  }

  if (event.type === "checkout.session.completed") {

    console.log("Payment successful");

  }

  res.json({ received: true });

});

// =======================

// DATABASE

// =======================

const db = new sqlite3.Database("./theScripto.db");

db.serialize(() => {

  db.run(`

    CREATE TABLE IF NOT EXISTS users (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      username TEXT UNIQUE,

      password TEXT,

      paid INTEGER DEFAULT 0

    )

  `);

  db.run(`

    CREATE TABLE IF NOT EXISTS posts (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      userId INTEGER,

      content TEXT

    )

  `);

});

// =======================

// AUTH

// =======================

function auth(req, res, next) {

  const token = req.headers.authorization;

  if (!token) return res.sendStatus(403);

  try {

    req.user = jwt.verify(token, JWT_SECRET);

    next();

  } catch {

    res.sendStatus(403);

  }

}

// =======================

// REGISTER

// =======================

app.post("/api/register", async (req, res) => {

  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.run(

    "INSERT INTO users (username, password) VALUES (?, ?)",

    [username, hash],

    function (err) {

      if (err) return res.status(400).json({ error: "User exists" });

      res.json({ success: true });

    }

  );

});

// =======================

// LOGIN

// =======================

app.post("/api/login", (req, res) => {

  db.get("SELECT * FROM users WHERE username = ?", [req.body.username], async (err, user) => {

    if (!user) return res.status(400).send("No user found");

    const valid = await bcrypt.compare(req.body.password, user.password);

    if (!valid) return res.status(403).send("Wrong password");

    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.json({ token });

  });

});

// =======================

// STRIPE PAYMENT (FIXED)

// =======================

app.post("/api/pay", auth, async (req, res) => {

  const session = await stripe.checkout.sessions.create({

    payment_method_types: ["card"],

    mode: "payment",

    line_items: [

      {

        price_data: {

          currency: "gbp",

          product_data: {

            name: "TheScripto Access"

          },

          unit_amount: 195

        },

        quantity: 1

      }

    ],

    success_url: "https://me2you-backend.onrender.com",

    cancel_url: "https://me2you-backend.onrender.com"

  });

  res.json({ url: session.url });

});

// =======================

// POSTS

// =======================

app.post("/api/post", auth, (req, res) => {

  const { content } = req.body;

  db.run(

    "INSERT INTO posts (userId, content) VALUES (?, ?)",

    [req.user.id, content]

  );

  res.json({ success: true });

});

app.get("/api/posts", (req, res) => {

  db.all("SELECT * FROM posts", [], (err, rows) => {

    res.json(rows);

  });

});

// =======================

// BASIC FRONTEND TEST PAGE

// =======================

app.get("/", (req, res) => {

  res.send(`

    <html>

    <body style="font-family:Arial;text-align:center">

      <h1>TheScripto</h1>

      <input id="u" placeholder="username"/>

      <input id="p" type="password" placeholder="password"/>

      <button onclick="register()">Register</button>

      <button onclick="login()">Login</button>

      <br><br>

      <textarea id="post"></textarea>

      <button onclick="createPost()">Post</button>

      <button onclick="pay()">Buy Now £1.95</button>

      <div id="feed"></div>

      <script>

        let token = "";

        async function register(){

          await fetch('/api/register',{

            method:'POST',

            headers:{'Content-Type':'application/json'},

            body:JSON.stringify({username:u.value,password:p.value})

          });

        }

        async function login(){

          let r = await fetch('/api/login',{

            method:'POST',

            headers:{'Content-Type':'application/json'},

            body:JSON.stringify({username:u.value,password:p.value})

          });

          let d = await r.json();

          token = d.token;

        }

        async function createPost(){

          await fetch('/api/post',{

            method:'POST',

            headers:{

              'Content-Type':'application/json',

              'Authorization':token

            },

            body:JSON.stringify({content:post.value})

          });

          load();

        }

        async function load(){

          let r = await fetch('/api/posts');

          let data = await r.json();

          feed.innerHTML = data.map(p => "<p>"+p.content+"</p>").join('');

        }

        async function pay(){

          let r = await fetch('/api/pay',{

            method:'POST',

            headers:{

              'Authorization': token,

              'Content-Type':'application/json'

            }

          });

          let data = await r.json();

          window.location.href = data.url;

        }

        load();

      </script>

    </body>

    </html>

  `);

});

// =======================

// START SERVER

// =======================

app.listen(PORT, () => {

  console.log("TheScripto LIVE");

});
