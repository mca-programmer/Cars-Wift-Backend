const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");

const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//middleware
app.use(express.json());
app.use(cors());



app.get("/", (req, res) => {
  res.send("Car Xpress server is running!");
});

app.listen(port, () => {
  console.log(`Car Xpress app listening on port ${port}`);
});
