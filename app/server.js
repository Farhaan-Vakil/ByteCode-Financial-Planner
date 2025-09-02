
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
let finnhub = require("finnhub");
//Use for local development
// const env = JSON.parse(fs.readFileSync("../env.json", "utf-8"));
const session = require("express-session");
//Use for Main Build
const env = {
  AWS_User: process.env.AWS_User,
  AWS_Password: process.env.AWS_Password,
  RDS_Endpoint: process.env.RDS_Endpoint,
  database: process.env.database,
  port: process.env.port,
  apiKey: process.env.apiKey
};

const api_key = finnhub.ApiClient.instance.authentications["api_key"];
api_key.apiKey = env.apiKey;

const finnhubClient = new finnhub.DefaultApi();
const yahooFinance = require('yahoo-finance2').default;

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(session({
  secret: "supersecretkey",        
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,                  
    sameSite: 'none',              
    maxAge: 24 * 60 * 60 * 1000    
  }
  //Use for local development
  /*
  cookie: { 
    secure: process.env.NODE_ENV === "production", 
    sameSite: 'lax', 
    maxAge: 24 * 60 * 60 * 1000
  }
  */
}));

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/expenses", async (req, res) => {
  const email = req.query.email;
  const budgetIndex = parseInt(req.query.budgetIndex) || 0;

  try {
    const userRes = await pool.query('SELECT budgets FROM accounts WHERE email = $1', [email]);
    let budgets = (userRes.rows.length > 0 && userRes.rows[0].budgets) ? userRes.rows[0].budgets : [];

    if (budgets.length === 0 || budgetIndex < 0 || budgetIndex >= budgets.length) {
      return res.status(400).json({ message: 'Invalid budget index' });
    }

    budgets[budgetIndex].expenses = budgets[budgetIndex].expenses || [];
    res.json(budgets[budgetIndex].expenses);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to get expenses");
  }
});

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const checkUser = await pool.query('SELECT * FROM accounts WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);

    await pool.query('INSERT INTO accounts (username, email, password) VALUES ($1, $2, $3)', [username, email, hashed]);
    res.json({ message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM accounts WHERE email = $1", [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.user = { email: user.email, id: user.id };
        return res.status(200).json({ message: "Login successful!" });
      }
    }
    res.status(401).json({ message: "Invalid email or password." });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Server error." });
  }
});


function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

app.get('/dashboard', requireLogin, async (req, res) => {
  const email = req.session.user.email;
  try {
    const userRes = await pool.query(
      'SELECT username, budgets FROM accounts WHERE email = $1',
      [email]
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const username = userRes.rows[0].username;
    let budgets = userRes.rows[0].budgets || [];
    if (budgets.length === 0) budgets = [{ income: 0, expenses: [], stocks: [] }];
    const latestBudget = budgets[budgets.length - 1];

    res.json({
      username,
      income: latestBudget.income || 0,
      expenses: latestBudget.expenses || [],
      stocks: latestBudget.stocks || [],
      apiKey: env.apiKey
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/update-income', requireLogin, async (req, res) => {
  const email = req.session.user.email; // get email from session
  const { income, budgetIndex } = req.body;

  if (income === undefined) {
    return res.status(400).json({ message: "Income is required" });
  }

  try {
    const userRes = await pool.query('SELECT budgets FROM accounts WHERE email = $1', [email]);
    let budgets = [];

    if (userRes.rows.length > 0 && userRes.rows[0].budgets) {
      budgets = typeof userRes.rows[0].budgets === "string"
        ? JSON.parse(userRes.rows[0].budgets)
        : userRes.rows[0].budgets;
    }

    if (budgets.length === 0) {
      budgets = [{ income: Number(income), expenses: [], stocks: [] }];
    } else {
      const idx = (budgetIndex !== undefined && budgetIndex >= 0 && budgetIndex < budgets.length) ? budgetIndex : 0;
      budgets[idx].income = Number(income);
    }

    await pool.query('UPDATE accounts SET budgets = $1 WHERE email = $2', [JSON.stringify(budgets), email]);
    res.json({ message: 'Income updated successfully', budgets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADD EXPENSE
app.post('/add-expense', requireLogin, async (req, res) => {
  const email = req.session.user.email; // get email from session
  const { expenseName, expense, budgetIndex } = req.body;

  try {
    const userRes = await pool.query('SELECT budgets FROM accounts WHERE email = $1', [email]);
    let budgets = userRes.rows.length > 0 && userRes.rows[0].budgets ? userRes.rows[0].budgets : [];
    if (budgets.length === 0) budgets = [{ income: 0, expenses: [], stocks: [] }];

    const idx = budgetIndex !== undefined && budgetIndex >= 0 && budgetIndex < budgets.length ? budgetIndex : 0;
    if (!Array.isArray(budgets[idx].expenses)) budgets[idx].expenses = [];

    const existingExpense = budgets[idx].expenses.find(e => e.name.toLowerCase() === expenseName.toLowerCase());
    if (existingExpense) existingExpense.amount = Number(expense);
    else budgets[idx].expenses.push({ name: expenseName, amount: Number(expense) });

    await pool.query('UPDATE accounts SET budgets = $1 WHERE email = $2', [JSON.stringify(budgets), email]);
    res.json({ message: 'Expense added/updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
app.post('/add-stock', requireLogin, async (req, res) => {
  const email = req.session.user.email;
  const { symbol, amount, budgetIndex } = req.body;

  if (!symbol || !amount) return res.status(400).json({ message: 'Stock symbol and amount are required' });

  const stockSymbol = symbol.toUpperCase();
  const shares = Number(amount);

  try {
    const stockQuote = await new Promise((resolve, reject) => {
      finnhubClient.quote(stockSymbol, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    if (!stockQuote || typeof stockQuote.c !== "number" || stockQuote.c === 0) {
      return res.status(400).json({ message: `Stock symbol "${stockSymbol}" not found` });
    }

    const userRes = await pool.query('SELECT budgets FROM accounts WHERE email = $1', [email]);
    let budgets = userRes.rows.length > 0 && userRes.rows[0].budgets ? userRes.rows[0].budgets : [];
    if (budgets.length === 0) budgets = [{ income: 0, expenses: [], stocks: [] }];

    const idx = budgetIndex !== undefined && budgetIndex >= 0 && budgetIndex < budgets.length ? budgetIndex : 0;
    if (!Array.isArray(budgets[idx].stocks)) budgets[idx].stocks = [];

    const existingStock = budgets[idx].stocks.find(s => s.symbol.toUpperCase() === stockSymbol);
    if (existingStock) existingStock.amount = shares;
    else budgets[idx].stocks.push({ symbol: stockSymbol, amount: shares });

    await pool.query('UPDATE accounts SET budgets = $1 WHERE email = $2', [JSON.stringify(budgets), email]);
    res.json({ message: 'Stock added/updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding stock' });
  }
});

app.post('/delete-stock', requireLogin, async (req, res) => {
  const email = req.session.user.email;
  const { symbol, budgetIndex } = req.body;

  if (!symbol) return res.status(400).json({ message: 'Stock symbol is required' });

  try {
    const userRes = await pool.query('SELECT budgets FROM accounts WHERE email = $1', [email]);
    let budgets = userRes.rows.length > 0 && userRes.rows[0].budgets ? userRes.rows[0].budgets : [];
    const idx = budgetIndex !== undefined ? budgetIndex : 0;

    if (!Array.isArray(budgets[idx].stocks)) budgets[idx].stocks = [];
    budgets[idx].stocks = budgets[idx].stocks.filter(s => s.symbol.toLowerCase() !== symbol.toLowerCase());

    await pool.query('UPDATE accounts SET budgets = $1 WHERE email = $2', [JSON.stringify(budgets), email]);
    res.json({ message: `Stock ${symbol} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/delete-expense', requireLogin, async (req, res) => {
  const email = req.session.user.email;
  const { name, budgetIndex } = req.body;

  if (!name) return res.status(400).json({ message: 'Expense name is required' });

  try {
    const userRes = await pool.query('SELECT budgets FROM accounts WHERE email = $1', [email]);
    let budgets = userRes.rows.length > 0 && userRes.rows[0].budgets ? userRes.rows[0].budgets : [];
    const idx = budgetIndex !== undefined ? budgetIndex : 0;

    if (!Array.isArray(budgets[idx].expenses)) budgets[idx].expenses = [];
    budgets[idx].expenses = budgets[idx].expenses.filter(e => e.name.toLowerCase() !== name.toLowerCase());

    await pool.query('UPDATE accounts SET budgets = $1 WHERE email = $2', [JSON.stringify(budgets), email]);
    res.json({ message: `Expense '${name}' deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get(`/news`, (req, res) => {
    finnhubClient.marketNews("general", {}, (error, data, response) => {
        if (error) {
            console.log(error);
            res.status(500).json({error: "Failed to fecth news"});

        }
        res.status(200).json(data);
        console.log(data);
    });
})

app.get(`/stockNews`, (req,res) => {
    let stockSymbol = req.query.stockSymbol;
    let sdate = req.query.sdate;
    let edate = req.query.edate;
    console.log(stockSymbol);
    finnhubClient.companyNews(stockSymbol, sdate, edate, (error,data,response) => {
        
        if (error) {
            console.log(error);
            res.status(500).json({error: "failed to fetch stock news"});
        }
        res.status(200).json(data);
        console.log(data.length);


    });
})

app.get('/stock-history', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ message: 'Stock symbol is required' });

  try {
    const period2 = new Date();
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - 1);

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: '1mo',
    });

    if (!result?.quotes || result.quotes.length === 0) {
      return res.status(404).json({ message: `No historical data found for ${symbol}` });
    }

    const formatted = result.quotes.map(q => ({
      date: new Date(q.date).toISOString().split('T')[0],
      close: q.close,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching stock history:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

app.get("/whatIf", async (req, res) => {
  const { stockSymbol, period1, period2, interval, shares } = req.query;
  if (!stockSymbol || !period1 || !period2 || !interval) {
    return res.status(400).json({ message: "Missing required query parameters" });
  }

  const shareCount = Number(shares || 1);
  const MAX_RETRIES = 3;
  const RETRY_BASE_MS = 300;

  function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function retryAsync(fn, name) {
    let lastErr = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const msg = (err && err.message) ? err.message : String(err);
        console.warn(`[whatIf] ${name} attempt ${attempt} failed:`, msg);
        if (attempt < MAX_RETRIES) {
          await wait(RETRY_BASE_MS * Math.pow(2, attempt - 1));
        }
      }
    }
    throw lastErr;
  }

  try {
    let p1 = new Date(period1);
    let p2 = new Date(period2);
    if (isNaN(p1) || isNaN(p2)) {
      return res.status(400).json({ message: "Invalid date format for period1/period2. Use YYYY-MM-DD." });
    }

    if (p1.getFullYear() === p2.getFullYear() && p1.getMonth() === p2.getMonth() && p1.getDate() === p2.getDate()) {
      p1 = new Date(p1);
      p1.setDate(p1.getDate() - 1);
    }

    let currentPrice = null;
    try {
      const q = await retryAsync(() => yahooFinance.quote(stockSymbol), 'yahoo.quote');
      currentPrice = q?.regularMarketPrice ?? q?.currentPrice ?? null;
    } catch (quoteErr) {
      console.warn("[whatIf] yahoo.quote ultimately failed:", quoteErr && quoteErr.message ? quoteErr.message : quoteErr);
      currentPrice = null;
    }

    let historicalClose = null;
    try {
      const history = await retryAsync(() => yahooFinance.chart(stockSymbol, { period1: p1, period2: p2, interval }), 'yahoo.chart');
      const quotes = history?.quotes || [];
      if (quotes.length > 0 && typeof quotes[0].close === "number") {
        historicalClose = quotes[0].close;
      }
    } catch (chartErr) {
      console.warn("[whatIf] yahoo.chart ultimately failed:", chartErr && chartErr.message ? chartErr.message : chartErr);
      historicalClose = null;
    }

    if (currentPrice != null && historicalClose == null) {
      try {
        const altStart = new Date(p2);
        altStart.setMonth(altStart.getMonth() - 1);
        const alt = await retryAsync(() => yahooFinance.chart(stockSymbol, { period1: altStart, period2: p2, interval: "1d" }), 'yahoo.chart-fallback');
        if (alt?.quotes?.length) historicalClose = alt.quotes[0].close;
      } catch (altErr) {
        console.warn("[whatIf] fallback chart failed:", altErr && altErr.message ? altErr.message : altErr);
      }
    }

    if (currentPrice == null && historicalClose == null) {
      return res.status(503).json({
        message: `Yahoo data temporarily unavailable for ${stockSymbol}.`,
        note: "quote and chart attempts failed. Try again later or verify network/proxy settings."
      });
    }

    if (historicalClose == null) {
      return res.json({
        historicalClose: null,
        currentPrice: Number(currentPrice),
        difference: 0,
        percentChange: 0,
        note: "No historical close found for the requested range; currentPrice returned."
      });
    }

    const difference = (Number(currentPrice) - Number(historicalClose)) * shareCount;
    const percentChange = historicalClose > 0 ? ((Number(currentPrice) - Number(historicalClose)) / Number(historicalClose)) * 100 : 0;

    return res.json({
      historicalClose: Number(historicalClose),
      currentPrice: Number(currentPrice),
      difference: Number(difference.toFixed(2)),
      percentChange: Number(percentChange.toFixed(2))
    });
  } catch (err) {
    console.error("[whatIf] unexpected error:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Unexpected server error in /whatIf", error: String(err) });
  }
});



app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://${"0.0.0.0"}:${port}/`);
});
//Use for local development
/*
app.listen(port, "localhost", () => {
  console.log(`Server running at http://${"localhost"}:${port}/`);
});
*/