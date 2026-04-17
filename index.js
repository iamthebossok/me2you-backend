const express = require("express");

const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

// ✅ Home route

app.get("/", (req, res) => {

  res.send("Me2You backend is running 🚀");

});

// ✅ Health check (used by Render + monitoring)

app.get("/health", (req, res) => {

  res.json({ status: "ok" });

});

// 🚀 Temporary test route (no database yet)

app.get("/test", (req, res) => {

  res.json({ success: true, message: "API is working" });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server running on port " + PORT);

});
