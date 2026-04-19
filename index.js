const express = require("express");

const cors = require("cors");

// Stripe safe init (prevents Render crash)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "missing_key");

const app = express();

app.use(cors());

app.use(express.json());

/* =========================

   🟢 HEALTH CHECK (IMPORTANT)

========================= */

app.get("/health", (req, res) => {

  res.json({ status: "ok", message: "Me2You backend running" });

});

/* =========================

   🟢 FRONTEND PAGE

========================= */

app.get("/", (req, res) => {

  res.send(`

    <html>

      <head>

        <title>Me2You App</title>

      </head>

      <body style="text-align:center;font-family:Arial;background:#111;color:white;padding:60px;">

        <h1>Me2You App 🚀</h1>

        <p>Unlock access for £5</p>

        <button onclick="buy()" style="padding:15px 30px;font-size:18px;cursor:pointer;">

          Buy Now £5

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

                alert("Payment failed: no URL returned");

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

/* =========================

   🟢 STRIPE CHECKOUT ROUTE

========================= */

app.post("/create-checkout-session", async (req, res) => {

  try {

    // Safety check

    if (!process.env.STRIPE_SECRET_KEY) {

      return res.status(500).json({

        error: "Stripe key missing in environment variables"

      });

    }

    const session = await stripe.checkout.sessions.create({

      payment_method_types: ["card"],

      mode: "payment",

      line_items: [

        {

          price_data: {

            currency: "gbp",

            product_data: {

              name: "Me2You Access"

            },

            unit_amount: 500

          },

          quantity: 1

        }

      ],

      success_url: "https://me2you-backend.onrender.com/",

      cancel_url: "https://me2you-backend.onrender.com/"

    });

    return res.json({ url: session.url });

  } catch (error) {

    console.log("Stripe Error:", error.message);

    return res.status(500).json({

      error: error.message

    });

  }

});

/* =========================

   🟢 START SERVER (RENDER SAFE)

========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("🚀 Me2You running on port " + PORT);

});
