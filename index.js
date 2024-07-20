// fai partire il server aprendo un terminale, andando nella cartella Progetto e facendo:
// node index.js
//oppure: npm start

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");
const cors = require("cors");
const path = require("path");

const router = require("./src/middlewares/routes.js")

// get config parameters from .env
const port = process.env.PORT || 4000;
const host = process.env.HOST || "localhost";

// declare express app
const app = express();

app.use(express.static(path.join(__dirname, "/src")));

app.use(
  cors({
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(cookieParser());

// add 'router' to express app's middleware handling path
app.use("/", router);

// check server is up and listening
app.listen(port, host, () => {
  console.log(`Server listening on port ${port}`);
});