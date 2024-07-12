const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const port = process.env.port || 3000;

// middleware

app.use(cors());
app.use(express.json());

//

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lxtvnq3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const dataBase = client.db("fitZone");
    const productsCollection = dataBase.collection("products");
    const cartProductUserCollection = dataBase.collection("cart");

    // all operation start

    // Create a new product
    app.post("/products", async (req, res) => {
      try {
        const newProduct = req.body;
        // console.log(newProduct);
        const result = await productsCollection.insertOne(newProduct);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create product", error });
      }
    });

    // create payment and user
    app.post("/payment", async (req, res) => {
      try {
        const cartProductUser = req.body;
        // console.log(cartProductUser);
        const result = await cartProductUserCollection.insertOne(
          cartProductUser
        );
        res.status(201).send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to create cartProductUser", error });
      }
    });

    // get all product
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    // get single product
    app.get("/singleProduct/:id", async (req, res) => {
      const productId = req.params.id;

      try {
        const result = await productsCollection.findOne({
          _id: new ObjectId(productId),
        });

        if (result) {
          res.send(result);
        } else {
          res.status(404).send({ message: "Product not found" });
        }
      } catch (error) {
        res.status(500).send({ message: "Error retrieving product", error });
      }
    });
    // PUT update a product by ID
    app.put("/products/:id", async (req, res) => {
      const productId = req.params.id;
      const updatedProduct = req.body;
      delete updatedProduct._id;
      console.log(productId, updatedProduct);

      try {
        // Update the product in the database
        const result = await productsCollection.updateOne(
          { _id: new ObjectId(productId) }, // Convert productId to ObjectId if using MongoDB's default ObjectId
          { $set: updatedProduct }
        );

        if (result.modifiedCount > 0) {
          res.json({ message: "Product updated successfully" });
        } else {
          res.status(404).json({ message: "Product not found" });
        }
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // / delete a single product by ID
    app.delete("/products/:id", async (req, res) => {
      const productId = req.params.id;

      try {
        const result = await productsCollection.deleteOne({
          _id: new ObjectId(productId),
        });

        if (result.deletedCount > 0) {
          res.json({ message: "Product deleted successfully" });
        } else {
          res.status(404).json({ message: "Product not found" });
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // update quantity
    app.put("/products/update/:id", async (req, res) => {
      const id = req.params.id;
      const updateReqProductStock = req.body;

      const product = await productsCollection.findOne({
        _id: new ObjectId(id),
      });

      const finalStock = product.stock - updateReqProductStock.updatedStock;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedStock = {
        $set: {
          stock: finalStock,
        },
      };

      const result = await productsCollection.updateOne(
        filter,
        updatedStock,
        options
      );
      res.send(result);
    });

    // all operation end

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//

app.get("/", (req, res) => {
  res.send("FitZone server running");
});

app.listen(port, () => {
  console.log(`FitZone is running on port ${port}`);
});
