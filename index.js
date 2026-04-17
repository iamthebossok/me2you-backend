const express = require("express");

const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {

  res.send("Me2You backend LIVE 🚀");

});

app.get("/health", (req, res) => {

  res.json({ status: "ok" });

});

app.get("/test", (req, res) => {

  res.json({ success: true });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server running");

});
