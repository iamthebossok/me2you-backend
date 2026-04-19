const express = require("express");

const cors = require("cors");

const Stripe = require("stripe");

const app = express();

app.use(cors());

app.use(express.json());

// ===============================

// CONFIG

// ===============================

const PORT = process.env.PORT || 3000;

// Safe Stripe init (prevents Render crash)

const stripe = process.env.STRIPE_SECRET_KEY

  ? Stripe(process.env.STRIPE_SECRET_KEY)

  : null;

// ===============================

// HEALTH CHECK (Render uses this mentally)

// ===============================

app.get("/health", (req, res) => {

  res.json({

    status: "LIVE",

    app: "TheScripto",

    price: "£1.95",

    stripeReady: !!stripe

  });

});

// ===============================

// FRONTEND PAGE

// ===============================

app.get("/", (req, res) => {

  res.send(`

    <html>

      <head>

        <title>TheScripto</title>

      </head>

      <body style="background:#111;color:white;font-family:Arial;text-align:center;padding:60px;">

        <h1>TheScripto 🚀</h1>

        <p>Unlock full access for £1.95</p>

        <button onclick="buy()" style="padding:15px 30px;font-size:18px;cursor:pointer;">

          Buy Now £1.95

        </button>

        <script>

          async function buy() {

            try {

              const res = await fetch("/create-checkout-session", {

                method: "POST"

              });

              const data = await res.json();

              if (data.url) {

                window.location.href = data.url;

              } else {

                alert("Checkout failed");

              }

            } catch (err) {

              alert("Server error");

              console.error(err);

            }

          }

        </script>

      </body>

    </html>

  `);

});

// ===============================

// STRIPE CHECKOUT

// ===============================

app.post("/create-checkout-session", async (req, res) => {

  try {

    if (!stripe) {

      return res.status(500).json({

        error: "Stripe is not configured on server"

      });

    }

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

      success_url: "https://me2you-backend.onrender.com/",

      cancel_url: "https://me2you-backend.onrender.com/"

    });

    res.json({ url: session.url });

  } catch (err) {

    console.log("Stripe error:", err.message);

    res.status(500).json({

      error: err.message

    });

  }

});

// ===============================

// START SERVER (RENDER SAFE)

// ===============================

app.listen(PORT, () => {

  console.log("🚀 TheScripto running on port " + PORT);

});
