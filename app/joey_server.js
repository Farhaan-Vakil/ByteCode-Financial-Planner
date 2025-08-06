const pg = require("pg");
const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);

pool.connect().then(() => {
  console.log(`Connected to database ${env.database}`);
});

app.use(express.static("public"));
app.use(express.json());


app.get("/expenses", async (req, res) => {
  try {
    const result = await pool.query("getting data from saving expenses");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to get expenses");
  }
});


app.post("/expenses", async (req, res) => {
  try {
    const savingsArray = req.body;
    if (!Array.isArray(savingsArray) || savingsArray.length === 0) {
      return res.status(400).send("Input should be array of {category, amount}");
    }

    const values = [];
    const placeholders = savingsArray.map((item, i) => {
      if (!item.category || typeof item.amount !== "number") {
        throw new Error("This item is invalid :(");
      }
      values.push(item.category, item.amount);
      return `($${i * 2 + 1}, $${i * 2 + 2})`;
    }).join(",");

    const query = `INSERT INTO savings (category, amount) VALUES ${placeholders}`;
    await pool.query(query, values);

    res.status(201).send("Savings inserted successfully :)");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database query failed");
  }
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});