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

//THIS ONE IS 
// EX { category: "Food", amount: 250}
app.get("/expenses", async (req, res) => {
  try {
    const result = await pool.query("SELECT category, amount FROM savings");
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

//Quite literally the exact same code as the other one 
//EX: { stock_name: "apple", value: 123.45}
app.post("/stock_performance", async (req, res) => {
  try {
    //LOOP FOR ARRAY SO YOU CAN PUT MULTIPLE THINGS AT ONCE OR MANY
    const stocksArray = req.body;
    if (!Array.isArray(stocksArray) || stocksArray.length === 0) {
      return res.status(400).send("Input should be array of {stock_name, value}");
    }

    const values = [];
    const placeholders = stocksArray.map((item, i) => {
      if (!item.stock_name || typeof item.value !== "number") {
        throw new Error("This item is invalid :(");
      }
      values.push(item.stock_name, item.value);
      return `($${i * 2 + 1}, $${i * 2 + 2})`;
    }).join(",");

    const query = `INSERT INTO stock_performance (stock_name, value) VALUES ${placeholders}`;
    await pool.query(query, values);

    res.status(201).send("Stocks inserted successfully :)");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database query failed");
  }
});

app.get("/stock_performance", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM stock_performance");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database query failed");
  }
});


//STOCK HISTORY IS A KEYVALUE PAIR CALLED DATA (DATE, VALUE)

//{
//  stock_name: "apple",
//  stock_data: { dec: 12, jan: 45, feb: 67 }
//}
//EX
app.post("/stock_history", async (req, res) => {
  try {
    const stocks_array = req.body;
    if (!Array.isArray(stocks_array) || stocks_array.length === 0) {
      return res.status(400).send("Input should be array of {stock_name, data}");
    }

    const values = [];
    const placeholders = stocks_array.map((item, i) => {
      if (!item.stock_name || typeof item.data !== "object") {
        throw new Error("This item is invalid :(");
      }
      values.push(item.stock_name, JSON.stringify(item.data));
      return `($${i * 2 + 1}, $${i * 2 + 2}::jsonb)`;
    }).join(",");

    const query = `INSERT INTO stock_history (stock_name, data) VALUES ${placeholders}`;
    await pool.query(query, values);

    res.status(201).send("Stock history inserted successfully :)");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database query failed");
  }
});

app.get("/stock_history", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM stock_history");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database query failed");
  }
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
