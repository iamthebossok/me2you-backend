const express = require("express");

const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

// 🏠 Home

app.get("/", (req, res) => {

  res.send("Me2You backend is running 🚀");

});

// ❤️ Health check

app.get("/health", (req, res) => {

  res.json({ status: "ok" });

});

// 👤 Simple users system (temporary memory)

let users = [];

// ➕ Create user

app.post("/users", (req, res) => {

  const { name, email } = req.body;

  if (!name || !email) {

    return res.status(400).json({ error: "Name and email required" });

  }

  const user = {

    id: users.length + 1,

    name,

    email

  };

  users.push(user);

  res.json({ success: true, user });

});

// 📄 Get users

app.get("/users", (req, res) => {

  res.json(users);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server running on port " + PORT);

});
Clean backend + users system
