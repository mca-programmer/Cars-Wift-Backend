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

//verify firebase token
const verifyFirebaseToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.token_email = userInfo.email;
    console.log("after token validation ", userInfo);
    next();
  } catch {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

//port and clients
const port = process.env.PORT || 5000;
const uri = process.env.URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    //DB and collection
    const db = client.db("cars_wift_db");
    const carsCollection = db.collection("cars");

    //cars apis here:)

    //get all cars data from db
    app.get("/cars", async (req, res) => {
      try {
        const { limit, search } = req.query;
        let query = {};
        const options = {
          projection: {
            created_at: 0,
            shortDescription: 0,
            userName: 0,
            userEmail: 0,
            phone: 0,
          },
        };

        if (search) {
          query.brand = { $regex: search, $options: "i" };
        }

        let cursor = carsCollection
          .find(query, options)
          .sort({ created_at: -1 });

        if (limit) {
          cursor = cursor.limit(parseInt(limit));
        }

        const result = await cursor.toArray();
        res.send(result);
      } catch {
        res.status(500).send({ message: "Failed to fetch cars" });
      }
    });

    //api for single car data
    app.get("/cars/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const options = {
          projection: {
            created_at: 0,
          },
        };

        const result = await carsCollection.findOne(query, options);
        res.send(result);
      } catch {
        res.status(500).send({ message: "Failed to fetch car" });
      }
    });



    //api for add car data to db

    const MAX_CARS = 5;

    app.post("/cars", verifyFirebaseToken, async (req, res) => {
      try {
        const { userEmail, ...car } = req.body;

        const count = await carsCollection.countDocuments({ userEmail });

        if (count >= MAX_CARS) {
          return res.status(429).send({
            message: "Maximum 5 cars allowed",
          });
        }

        const newCar = {
          ...car,
          userEmail,
          created_at: new Date(),
        };

        const result = await carsCollection.insertOne(newCar);
        res.send(result);
      } catch {
        res.status(500).send({ message: "Failed to add car" });
      }
    });

    // delete api
    app.delete("/cars/:id", verifyFirebaseToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await carsCollection.deleteOne(query);
        res.send(result);
      } catch {
        res.status(500).send({ message: "Failed to add car" });
      }
    });

    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Car Xpress server is running!");
});

app.listen(port, () => {
  console.log(`Car Xpress app listening on port ${port}`);
});
