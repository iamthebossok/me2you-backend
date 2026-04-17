const express = require("express");

const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

let users = [];

app.get("/", (req, res) => {

  res.send("Me2You App LIVE 🚀");

});

app.post("/users", (req, res) => {

  const { name, email } = req.body;

  users.push({ id: users.length + 1, name, email });

  res.json({ success: true });

});

app.get("/users", (req, res) => {

  res.json(users);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server running");

});
const express = require("express");

const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

// 🧠 memory storage (temporary)

let users = [];

// 🏠 FRONTEND UI

app.get("/", (req, res) => {

  res.send(`

    <html>

      <head>

        <title>Me2You App</title>

        <style>

          body { font-family: Arial; text-align:center; padding:40px; }

          input { padding:10px; margin:5px; }

          button { padding:10px 15px; margin:10px; cursor:pointer; }

          pre { background:#f4f4f4; padding:10px; }

        </style>

      </head>

      <body>

        <h1>Me2You App 🚀</h1>

        <h3>Create User</h3>

        <input id="name" placeholder="Name" />

        <input id="email" placeholder="Email" />

        <br/>

        <button onclick="createUser()">Create User</button>

        <h3>View Users</h3>

        <button onclick="loadUsers()">Load Users</button>

        <pre id="output"></pre>

        <script>

          async function createUser() {

            const name = document.getElementById('name').value;

            const email = document.getElementById('email').value;

            await fetch('/users', {

              method: 'POST',

              headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify({ name, email })

            });

            alert('User created!');

          }

          async function loadUsers() {

            const res = await fetch('/users');

            const data = await res.json();

            document.getElementById('output').innerText = JSON.stringify(data, null, 2);

          }

        </script>

      </body>

    </html>

  `);

});

// ➕ create user

app.post("/users", (req, res) => {

  const { name, email } = req.body;

  if (!name || !email) {

    return res.status(400).json({ error: "Missing fields" });

  }

  const user = {

    id: users.length + 1,

    name,

    email

  };

  users.push(user);

  res.json({ success: true, user });

});

// 📄 get users

app.get("/users", (req, res) => {

  res.json(users);

});

// ❤️ health check

app.get("/health", (req, res) => {

  res.json({ status: "ok" });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server running on port " + PORT);

});
