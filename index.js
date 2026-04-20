const express = require("express");

const cors = require("cors");

const Stripe = require("stripe");

const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());

app.use(express.json());

// ENV

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// HEALTH CHECK

app.get("/", (req, res) => {

  res.send("TheScripto backend LIVE 🚀");

});

// AUTH TEST TOKEN

function auth(req, res, next) {

  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ error: "No token" });

  try {

    req.user = jwt.verify(token, JWT_SECRET);

    next();

  } catch {

    return res.status(403).json({ error: "Invalid token" });

  }

}

// LOGIN MOCK (so app works immediately)

app.post("/api/login", (req, res) => {

  const token = jwt.sign({ id: 1 }, JWT_SECRET);

  res.json({ token });

});

// STRIPE PAYMENT (THIS IS YOUR BUTTON FIX)

app.post("/api/pay", auth, async (req, res) => {

  try {

    const session = await stripe.checkout.sessions.create({

      mode: "payment",

      payment_method_types: ["card"],

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

      success_url: "https://example.com/success",

      cancel_url: "https://example.com/cancel"

    });

    res.json({ url: session.url });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("TheScripto running on port " + PORT);

});
