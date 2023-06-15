const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'Unauthorized access' });
  }
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'Unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-lkphvzo-shard-00-00.dysamrx.mongodb.net:27017,ac-lkphvzo-shard-00-01.dysamrx.mongodb.net:27017,ac-lkphvzo-shard-00-02.dysamrx.mongodb.net:27017/?ssl=true&replicaSet=atlas-11u6ye-shard-0&authSource=admin&retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const usersCollection = client.db("encoremusic").collection("userCollection")
    const classCollection = client.db("encoremusic").collection("classCollection")
    const instructorCollection = client.db("encoremusic").collection("instructorCollection")
    const selectedClassesCollection = client.db("encoremusic").collection("selectedClasses")
    
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })

    // User api
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Class Api
    app.get("/classes", async(req, res) => {
      let query = {};
      const ascendingSort = {
        sort: {total_enrolled_students: -1}
      }
      const result = await classCollection.find(query, ascendingSort).toArray();
      res.send(result);
    })

    app.post("/classes", verifyJWT, async(req, res) => {
      const classItem = req.body;
      const result = await selectedClassesCollection.insertOne(classItem)
      res.send(result)
    })

    // Instructor Api
    app.get("/instructors", async(req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Encore Music Academy server is running");
  })
  
  app.listen(port, () => {
    console.log(`Encore Music Academy server is running on port: ${port}`);
  })