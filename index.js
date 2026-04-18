const express = require("express");

const cors = require("cors");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors());

app.use(express.json());

// 🟢 FRONTEND PAGE

app.get("/", (req, res) => {

  res.send(`

    <html>

      <body style="text-align:center;font-family:Arial;padding:60px;background:#111;color:white;">

        <h1>Me2You App 🚀</h1>

        <button onclick="buy()" style="padding:15px 30px;font-size:18px;">

          Buy Now £5

        </button>

        <script>

          async function buy() {

            const res = await fetch("/create-checkout-session", {

              method: "POST"

            });

            const data = await res.json();

            window.location.href = data.url;

          }

        </script>

      </body>

    </html>

  `);

});

// 🟢 STRIPE ROUTE (THIS FIXES YOUR ERROR)

app.post("/create-checkout-session", async (req, res) => {

  try {

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

    res.json({ url: session.url });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("LIVE"));
