const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const app = express();
const hostname = "localhost";
const port = 3000;

const env = JSON.parse(fs.readFileSync("../env.json", "utf-8"));
//use for AWS Database
const pool = new Pool({
  user: env.AWS_User,
  host: env.RDS_Endpoint,
  database: env.database,
  password: env.AWS_Password,
  port: env.port,
  ssl: {
    rejectUnauthorized: false,
  },
});
/* Use for local database also use npm setup
const pool = new Pool({
  user: env.Local_User,
  host: env.Local_Host,
  database: env.database,
  password: env.Local_Password,
  port: env.port
});
*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const checkUser = await pool.query('SELECT * FROM Accounts WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);

    await pool.query('INSERT INTO Accounts (username, email, password) VALUES ($1, $2, $3)', [username, email, hashed]);
    res.json({ message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM Accounts WHERE email = $1",
      [email]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        res.status(200).json({ message: "Login successful!" });
      } else {
        res.status(401).json({ message: "Invalid email or password." });
      }
    } else {
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Server error." });
  }
});


app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
