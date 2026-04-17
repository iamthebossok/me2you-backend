const express = require("express");

const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

let users = [];

// Home (your live check)

app.get("/", (req, res) => {

  res.send("Me2You App LIVE 🚀");

});

// Create user

app.post("/users", (req, res) => {

  const { name, email } = req.body;

  if (!name || !email) {

    return res.status(400).json({ error: "Missing name or email" });

  }

  const user = {

    id: users.length + 1,

    name,

    email

  };

  users.push(user);

  res.json({ success: true, user });

});

// Get users

app.get("/users", (req, res) => {

  res.json(users);

});

// Health check

app.get("/health", (req, res) => {

  res.json({ status: "ok" });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server running on port " + PORT);

});
