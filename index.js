const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 4000;

const app = express();
// middleware
app.use(cors());
app.use(express.json());

//mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.llx3uvn.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true, 
  serverApi: ServerApiVersion.v1,
 });

//verify jwt
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_JWT_TOKEN, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const productsCollection = client.db("assignment-twelve").collection("products");
    const categoryCollection = client.db("assignment-twelve").collection("category");
    const bookingsCollection = client.db("assignment-twelve").collection("bookings");
    const usersCollection = client.db("assignment-twelve").collection("users");
    const paymentsCollection = client.db("assignment-twelve").collection("payment");
    const wishListCollection = client.db("assignment-twelve").collection("wishList");
    const advertiseCollection = client.db("assignment-twelve").collection("advertise");
    const reportCollection = client.db("assignment-twelve").collection("report");
    app.get("/category", async (req, res) => {
      const query = {};
      const result = await categoryCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/products", async (req, res) => {
      const query = {};
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/myProducts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const addProduct = await productsCollection.find(query).toArray();
      res.send(addProduct);
    });

    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const filter = { category_id: id };
      const result = await productsCollection.find(filter).toArray();
      res.send(result);
    });

    //add product
    app.post("/addProduct", verifyJWT, async (req, res) => {
      const add = req.body;
      const result = await productsCollection.insertOne(add);
      res.send(result);
    });

    app.post("/advertise", async (req, res) => {
      const query = req.body;
      const result = await advertiseCollection.insertOne(query);
      res.send(result);
    });
    app.get("/advertise", async (req, res) => {
      const query = req.body;
      const result = await advertiseCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/users/advertise/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id:(id) };
      const result = await advertiseCollection.deleteOne(filter);
      res.send(result);
    });
    app.delete("/users/seller/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
      res.send(result);
    });
    app.post("/wishlist", async (req, res) => {
      const query = req.body;
      const result = await wishListCollection.insertOne(query);
      res.send(result);
    });
    app.get("/wishlist", async (req, res) => {
      const query = {};
      const result = await wishListCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/report', async (req, res)=>{
      const body = req.body 
      const result = await reportCollection.insertOne(body)
      res.send(result)
    })
    app.get("/report", async (req, res) => {
      const query = {};
      const result = await reportCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/users/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id)
      
      const query = { _id:(id) };
      console.log(query)
      
      const result = await wishListCollection.deleteOne(query);
      console.log(result)
      
      res.send(result);
    });
    //bookings
    app.post("/bookings", verifyJWT, async (req, res) => {
      const booking = req.body;
      const query = {
        productName: booking.productName,
        email: booking.email,
        // name: booking.name
      };
      const alreadyBooked = await bookingsCollection.find(query).toArray();

      if (alreadyBooked.length > 0) {
        const message = `You already have booked ${booking.productName}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // app.get("/bookings/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const bookings = await bookingsCollection.findOne(query);
    //   res.send(bookings);
    // });

    app.get("/bookings",  verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });
    //get user data
    
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

//jwt start
    // app.get("/jwt", async (req, res) => {
    //   const email = req.query.email;
    //   const query = { email: email };
    //   const user = await usersCollection.findOne(query);
    //   if (user) {
    //     const token = jwt.sign({ email }, process.env.ACCESS_JWT_TOKEN, {
    //       expiresIn: "5d",
    //     });
    //     return res.send({ accessToken: token });
    //   }
    //   res.status(403).send({ accessToken: "" });
    // });
    // //jwt end

    // //get user data
    // app.get("/users", async (req, res) => {
    //   const query = {};
    //   const result = await usersCollection.find(query).toArray();
    //   res.send(result);
    // });
    // app.get('/buyerSeller', async (req, res)=>{
    //   const filter = {role: 'buyer'}
    //   const query = {role: 'seller'}
    //   const buyer = usersCollection.find(filter).toArray()
    //   const seller = usersCollection.find(query).toArray()
    //   res.send({
    //     data: {buyer, seller}
    //   })
    // })
    // app.get('/buyer', async(req, res)=>{
    //   const query = {}
    //   const result = await usersCollection.find(query).project({role: 1}).toArray()
    //   res.send(result)
    // })
    //make admin or seller
    // app.put("/users/admin/:id", verifyJWT, async (req, res) => {
    //   const decodedEmail = req.decoded.email;
    //   const query = { email: decodedEmail };
    //   const user = await usersCollection.findOne(query);
    //   if (user?.role !== "admin") {
    //     return res.status(403).send({ message: "forbidden access" });
    //   }

    //   const id = req.params.id;
    //   const filter = { _id: ObjectId(id) };
    //   const options = { upsert: true };
    //   const updatedDoc = {
    //     $set: {
    //       status: "verified",
    //     },
    //   };
    //   const result = await usersCollection.updateOne(
    //     filter,
    //     updatedDoc,
    //     options
    //   );
    //   res.send(result);
    // });
    // //user delete
    // app.delete("/users/admin/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const result = await usersCollection.deleteOne(query);
    //   res.send(result);
    // });

    // //visit dashboard

    // app.get("/users/admin/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email };
    //   const user = await usersCollection.findOne(query);
    //   res.send({ isAdmin: user?.role === "admin" });
    // });
    // app.get("/users/seller/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email };
    //   const user = await usersCollection.findOne(query);
    //   res.send({ isSeller: user?.role === "seller" });
    // });
    // app.get("/users/buyer/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email };
    //   const user = await usersCollection.findOne(query);
    //   res.send({ isBuyer: user?.role === "buyer" });
    // });
    // //PAYMENT
    // app.post("/create-payment-intent", async (req, res) => {
    //   const booking = req.body;
    //   const price = booking.price;
    //   const amount = price * 100;

    //   const paymentIntent = await stripe.paymentIntents.create({
    //     currency: "usd",
    //     amount: amount,
    //     payment_method_types: ["card"],
    //   });
    //   res.send({
    //     clientSecret: paymentIntent.client_secret,
    //   });
    // });
    //second part of payment
    // 
  } catch (error) {
    console.log(error.name, error.message);
  }
}
run().catch((error) => {
  console.log(error);
});

app.get("/", async (req, res) => {
  res.send("buy and sell server is running");
});

app.listen(port, () => console.log(`Buy And Sell portal running on ${port}`));

