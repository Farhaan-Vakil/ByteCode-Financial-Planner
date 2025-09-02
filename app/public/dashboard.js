    let apiKey = "";
    let savingsChart = null;
    let stockChart = null;
    let stockHistoryChart = null;
    let whatIfChart = null;
    let stockCache = { totalValue: 0, lastUpdated: 0 };

    Chart.register(ChartDataLabels);

    const incomeInput = document.getElementById("income");
    const payInterval = document.getElementById("payInterval");
    const percentSlider = document.getElementById("percentSlider");
    const investPercent = document.getElementById("investPercent");
    const investAmount = document.getElementById("investAmount");
    const incomeDisplay = document.getElementById("incomeDisplay");

    const updateIncomeBtn = document.getElementById("updateIncomeBtn");
    const addExpenseBtn = document.getElementById("addExpenseBtn");
    const addStockBtn = document.getElementById("addStockBtn");

    const expenseNameEl = document.getElementById("expenseName");
    const expenseEl = document.getElementById("expense");

    const stockSymbolEl = document.getElementById("StockSymbol");
    const sharesEl = document.getElementById("shares");

    const expensesBody = document.getElementById("expenses");
    const stocksBody = document.getElementById("stocks");

    const searchBtn = document.getElementById("searchBtn");
    const applyFilterBtn = document.getElementById("applyFilterBtn");
    const stockSearch = document.getElementById("stockSearch");
    const stockTableBody = document.querySelector("#stockTable tbody");

    const whatIfForm = document.getElementById("whatIfForm");
    const stockWhatIf = document.getElementById("stockWhatIf");
    const sdate = document.getElementById("sdate");
    const sharesWhatIf = document.getElementById("sharesWhatIf");
    const whatIfResult = document.getElementById("whatIfResult");
    const stockList = document.getElementById("stockList");

    let currentExpenses = [];
    let currentStocks = [];

    function getYearlyIncome() {
      const raw = parseFloat(incomeInput.value) || 0;
      const interval = payInterval.value;
      if (interval === "weekly") return raw * 52;
      if (interval === "monthly") return raw * 12;
      return raw;
    }

    function setIncomeDisplay() {
      const yearly = getYearlyIncome();
      incomeDisplay.textContent = "Current Income: " + yearly;
    }

    function updateInvestmentAmount() {
      const yearlyIncome = getYearlyIncome();
      const totalExpenses = currentExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const netIncome = yearlyIncome - totalExpenses;
      const pct = parseFloat(percentSlider.value);
      const invest = (pct / 100) * netIncome;
      investPercent.textContent = pct + "%";
      investAmount.textContent = "$" + invest.toFixed(2);
      renderSavingsChart();
    }

    async function updateStockCache() {
      let total = 0;
      for (const st of currentStocks) {
        try {
          const res = await fetch(
            `/whatIf?stockSymbol=${encodeURIComponent(st.symbol)}&period1=${getDateNMonthAgo(12)}&period2=${getDateNMonthAgo(0)}&interval=1d&shares=${st.amount}`
          );
          const data = await res.json();
          if (data && data.currentPrice) {
            total += Number(data.currentPrice) * Number(st.amount);
          }
        } catch (e) {
          console.warn("Stock fetch failed for", st.symbol);
        }
      }
      stockCache.totalValue = total;
      stockCache.lastUpdated = Date.now();
    }
    function renderSavingsChart() {
      const yearlyIncome = getYearlyIncome();
      const totalExpenses = currentExpenses.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      );
      const invest =
        parseFloat(investAmount.textContent.replace("$", "")) || 0;
      const savings = yearlyIncome - totalExpenses - invest;

      const totalInvestments = invest + stockCache.totalValue;

      const ctx = document.getElementById("savings_plan").getContext("2d");
      if (savingsChart) savingsChart.destroy();

      savingsChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Expenses", "Investments", "Savings"],
          datasets: [
            {
              data: [totalExpenses, totalInvestments, savings],
              backgroundColor: ["#ff6384", "#85BB65", "#36a2eb"],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top" },
            datalabels: {
              color: "#fff",
              font: { weight: "bold", size: 12 },
              formatter: (value) => "~$" + Math.floor(value),
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    }

      function renderExpenses(expenses) {
        expensesBody.innerHTML = "";
        expenses.forEach(exp => {
          const tr = document.createElement("tr");
          tr.innerHTML =
            `<td>${exp.name}: $${exp.amount}</td>` +
            '<td><button class="btn delete-btn">Delete</button></td>';
          const btn = tr.querySelector(".delete-btn");
          btn.addEventListener("click", async () => {
            const res = await fetch("/delete-expense", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ name: exp.name }) // email removed
            });
            if (res.ok) {
              currentExpenses = currentExpenses.filter(e => e.name !== exp.name);
              renderExpenses(currentExpenses);
              updateInvestmentAmount();
            } else {
              alert("Error deleting expense");
            }
          });
          expensesBody.appendChild(tr);
        });
      }

      async function renderStocks(stocks) {
        stocksBody.innerHTML = "";
        stockList.innerHTML = "";

        for (const st of stocks) {
          const symbol = st.symbol;
          if (!symbol || !st.amount) continue;

          try {
            const res = await fetch(`/whatIf?stockSymbol=${encodeURIComponent(symbol)}&period1=${getDateNMonthAgo(12)}&period2=${getDateNMonthAgo(0)}&interval=1d&shares=${st.amount}`);
            const data = await res.json();
            if (!data || !data.currentPrice) continue;

            const price = Number(data.currentPrice);
            const total = (price * Number(st.amount)).toFixed(2);

            const tr = document.createElement("tr");
            tr.innerHTML =
              `<td><a href="stockNews.html?stockSymbol=${symbol}">${symbol}</a></td>` +
              `<td>${st.amount}</td>` +
              `<td>$${price.toFixed(2)}</td>` +
              `<td>$${total}</td>` +
              '<td><button class="btn delete-btn">Delete</button></td>';

            const btn = tr.querySelector(".delete-btn");
            btn.addEventListener("click", async () => {
              const resDel = await fetch("/delete-stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ symbol }) // email removed
              });
              if (resDel.ok) await loadDashboard();
              else alert("Error deleting stock");
            });

            stocksBody.appendChild(tr);

            const opt = document.createElement("option");
            opt.value = symbol;
            stockList.appendChild(opt);

          } catch (e) {
            console.error(`Failed to load stock ${symbol}`, e);
          }
        }
      }

      async function loadStockPerformance(stocks) {
        const ctx = document.getElementById("stock_performance").getContext("2d");
        const labels = [];
        const values = [];

        for (const st of stocks) {
          try {
            const res = await fetch(`/whatIf?stockSymbol=${encodeURIComponent(st.symbol)}&period1=${getDateNMonthAgo(12)}&period2=${getDateNMonthAgo(0)}&interval=1d&shares=${st.amount}`);
            const data = await res.json();
            if (!data || !data.currentPrice) continue;

            labels.push(st.symbol);
            values.push(Math.floor(Number(data.currentPrice) * Number(st.amount)));
          } catch (e) {}
        }

        if (stockChart) stockChart.destroy();

        stockChart = new Chart(ctx, {
          type: "bar",
          data: { labels: labels, datasets: [{ label: "Stock Value", data: values, backgroundColor: "#36a2eb" }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: { legend: { display: true }, datalabels: { display: false } },
            scales: { x: { ticks: { callback: function(v) { return v; } } } }
          }
        });
      }

      async function loadStockHistory(stocks) {
        const ctx = document.getElementById("stock_history").getContext("2d");
        const datasets = [];
        let labels = [];
        for (const st of stocks) {
          try {
            const res = await fetch("/stock-history?symbol=" + encodeURIComponent(st.symbol));
            const data = await res.json();
            if (!data || !data.length) { continue; }
            if (labels.length === 0) { labels = data.map(function (d) { return d.date; }); }
            const color = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
            datasets.push({
              label: st.symbol,
              data: data.map(function (d) { return d.close; }),
              borderColor: color,
              backgroundColor: color + "22",
              fill: false,
              tension: 0.2
            });
          } catch (e) {}
        }
        if (stockHistoryChart) { stockHistoryChart.destroy(); }
        stockHistoryChart = new Chart(ctx, {
          type: "line",
          data: { labels: labels, datasets: datasets },
          options: { responsive: true,maintainAspectRatio: false, plugins: { datalabels: { display: false } }, interaction: { intersect: false, mode: "index" } }
        });
      }

      async function searchStock() {
        const sym = (stockSearch.value || "").toUpperCase();
        if (!sym) { alert("Enter a stock symbol"); return; }

        try {
          const res = await fetch(`/whatIf?stockSymbol=${encodeURIComponent(sym)}&period1=${getDateNMonthAgo(12)}&period2=${getDateNMonthAgo(0)}&interval=1d&shares=1`);
          const data = await res.json();
          if (!data || !data.currentPrice) { alert("Stock not found"); return; }

          stockTableBody.innerHTML =
            `<tr>
              <td>${sym}</td>
              <td>${sym}</td>
              <td>$${Number(data.currentPrice).toFixed(2)}</td>
              <td>${(data.difference || 0).toFixed(2)}</td>
              <td>${(data.percentChange || 0).toFixed(2)}%</td>
            </tr>`;
        } catch (e) {
          console.error(e);
          alert("Error fetching stock data");
        }
      }

    async function fetchStocksList() {
        try {
          const res = await fetch("/top100.json");
          const data = await res.json();
          if (Array.isArray(data) && data.length) { return data.slice(0, 15); }
          return ["AAPL","MSFT","AMZN","GOOGL","META","NVDA","TSLA","BRK.B","UNH","JNJ","V","XOM","JPM","MA","HD"];
        } catch (e) {
          return ["AAPL","MSFT","AMZN","GOOGL","META","NVDA","TSLA","BRK.B","UNH","JNJ","V","XOM","JPM","MA","HD"];
        }
      }

      async function fetchStocks() {
        const symbols = await fetchStocksList();
        stockTableBody.innerHTML = "";

        for (const sym of symbols) {
          try {
            const yahooSym = sym.replace(".", "-");

            const res = await fetch(`/whatIf?stockSymbol=${encodeURIComponent(yahooSym)}&period1=${getDateNMonthAgo(12)}&period2=${getDateNMonthAgo(0)}&interval=1d&shares=1`);
            
            if (!res.ok) {
              console.warn(`Failed to fetch stock ${sym}: ${res.statusText}`);
              continue;
            }

            const data = await res.json();

            const price = Number(data.currentPrice || 0);
            const difference = Number(data.difference || 0);
            const percentChange = Number(data.percentChange || 0);

            const tr = document.createElement("tr");
            tr.innerHTML =
              `<td>${sym}</td>` +
              `<td>${sym}</td>` +
              `<td>$${price.toFixed(2)}</td>` +
              `<td>${difference.toFixed(2)}</td>` +
              `<td>${percentChange.toFixed(2)}%</td>`;

            stockTableBody.appendChild(tr);

            const opt = document.createElement("option");
            opt.value = sym;
            stockList.appendChild(opt);

          } catch (e) {
            console.error(`Failed to fetch stock ${sym}`, e);
          }
        }
      }
      async function fetchStocksList() {
        try {
          const res = await fetch("/top100.json");
          const data = await res.json();
          if (Array.isArray(data) && data.length) { return data.slice(0, 15); }
          return ["AAPL","MSFT","AMZN","GOOGL","META","NVDA","TSLA","BRK.B","UNH","JNJ","V","XOM","JPM","MA","HD"];
        } catch (e) {
          return ["AAPL","MSFT","AMZN","GOOGL","META","NVDA","TSLA","BRK.B","UNH","JNJ","V","XOM","JPM","MA","HD"];
        }
      }

      async function fetchStocks() {
        const symbols = await fetchStocksList();
        stockTableBody.innerHTML = "";

        for (const sym of symbols) {
          try {
            const yahooSym = sym.replace(".", "-");

            const res = await fetch(`/whatIf?stockSymbol=${encodeURIComponent(yahooSym)}&period1=${getDateNMonthAgo(12)}&period2=${getDateNMonthAgo(0)}&interval=1d&shares=1`);
            
            if (!res.ok) {
              console.warn(`Failed to fetch stock ${sym}: ${res.statusText}`);
              continue;
            }

            const data = await res.json();

            const price = Number(data.currentPrice || 0);
            const difference = Number(data.difference || 0);
            const percentChange = Number(data.percentChange || 0);

            const tr = document.createElement("tr");
            tr.innerHTML =
              `<td>${sym}</td>` +
              `<td>${sym}</td>` +
              `<td>$${price.toFixed(2)}</td>` +
              `<td>${difference.toFixed(2)}</td>` +
              `<td>${percentChange.toFixed(2)}%</td>`;

            stockTableBody.appendChild(tr);

            const opt = document.createElement("option");
            opt.value = sym;
            stockList.appendChild(opt);

          } catch (e) {
            console.error(`Failed to fetch stock ${sym}`, e);
          }
        }
      }


      function getDateNMonthAgo(n) {
        const d = new Date();
        d.setMonth(d.getMonth() - n);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
      }

      async function runWhatIf(symbol, months, shares) {
        const endDate = getDateNMonthAgo(0);
        const startDate = getDateNMonthAgo(months);
        const paramsW = new URLSearchParams({
          stockSymbol: symbol,
          period1: startDate,
          period2: endDate,
          interval: "1d",
          shares: String(shares)
        });

        try {
          const res = await fetch("/whatIf?" + paramsW.toString());
          if (res.ok) {
            const data = await res.json();
            if (data && data.historicalClose !== undefined && data.currentPrice !== undefined) {
              return data;
            }
          }
        } catch (e) {}

        const histRes = await fetch("/stock-history?symbol=" + encodeURIComponent(symbol));
        if (!histRes.ok) { throw new Error("history"); }
        const hist = await histRes.json();
        if (!Array.isArray(hist) || !hist.length) { throw new Error("history"); }

        const start = new Date(startDate);
        let nearest = null;
        let minDelta = Infinity;

        for (const p of hist) {
          const d = new Date(p.date);
          const delta = Math.abs(d - start);
          if (delta < minDelta) {
            minDelta = delta;
            nearest = p;
          }
        }

        if (!nearest || typeof nearest.close !== "number") { throw new Error("history"); }

        const quoteUrl = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + apiKey;
        const qRes = await fetch(quoteUrl);
        const qData = await qRes.json();
        const currentPrice = Number(qData.c || 0);
        const historicalClose = Number(nearest.close);

        const valueThen = historicalClose * shares;
        const valueNow = currentPrice * shares;
        const difference = valueNow - valueThen;

        let pct = 0;
        if (historicalClose > 0) {
          pct = ((currentPrice - historicalClose) / historicalClose) * 100;
        }

        return {
          historicalClose: historicalClose,
          currentPrice: currentPrice,
          difference: Number(difference.toFixed(2)),
          percentChange: Number(pct.toFixed(2))
        };
      }

      async function drawWhatIfChart(symbol, months) {
        const res = await fetch("/stock-history?symbol=" + encodeURIComponent(symbol));
        const data = await res.json();
        if (!data || !data.length) { return; }

        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);

        const filt = data.filter(function (d) {
          return new Date(d.date) >= cutoff;
        });

        const labels = filt.map(function (d) { return d.date; });
        const values = filt.map(function (d) { return d.close; });

        const ctx = document.getElementById("what_if_chart").getContext("2d");
        if (whatIfChart) { whatIfChart.destroy(); }

        whatIfChart = new Chart(ctx, {
          type: "line",
          data: { labels: labels, datasets: [{ label: symbol, data: values, borderColor: "#7b61ff", fill: false, tension: 0.2 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { datalabels: { display: false }, legend: { display: true } } }
        });
      }

      async function loadDashboard() {
        const res = await fetch("/dashboard", { credentials: "include" });
        const data = await res.json();
        apiKey = data.apiKey || "";
        if (!data || !data.username) {
          document.body.innerHTML = "<h2>Error loading dashboard. Please log in again.</h2>";
          setTimeout(function () { window.location.href = "login.html"; }, 1500);
          return;
        }
        document.getElementById("greeting").textContent = "Hello, " + data.username + "!";
        payInterval.value = "yearly";
        incomeInput.value = data.income || "";
        setIncomeDisplay();
        currentExpenses = Array.isArray(data.expenses) ? data.expenses : [];
        renderExpenses(currentExpenses);
        currentStocks = Array.isArray(data.stocks) ? data.stocks : [];
        await renderStocks(currentStocks);
        updateInvestmentAmount();
        if (currentStocks.length) {
          await loadStockPerformance(currentStocks);
          await loadStockHistory(currentStocks);
        }
        await fetchStocks();
      }

      updateIncomeBtn.addEventListener("click", async function () {
        const income = getYearlyIncome();
        const res = await fetch("/update-income", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ income }) // email removed
        });
        if (!res.ok) { alert("Failed to update income"); return; }
        setIncomeDisplay();
        updateInvestmentAmount();
      });

      addExpenseBtn.addEventListener("click", async function () {
        const name = (expenseNameEl.value || "").trim();
        const amount = Number(expenseEl.value);
        if (!name || !amount) { alert("Enter a valid expense name and amount"); return; }
        const res = await fetch("/add-expense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ expenseName: name, expense: amount }) // email removed
        });
        if (!res.ok) { alert("Failed to add expense"); return; }
        expenseNameEl.value = "";
        expenseEl.value = "";
        await loadDashboard();
      });

      addStockBtn.addEventListener("click", async function () {
        const symbol = (stockSymbolEl.value || "").toUpperCase();
        const amount = Number(sharesEl.value);
        if (!symbol || amount <= 0) { alert("Enter a valid symbol and amount"); return; }
        try {
          const url = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + apiKey;
          const res = await fetch(url);
          const data = await res.json();
          if (!data || typeof data.c !== "number" || data.c === 0) { alert("Invalid stock symbol"); return; }
          const res2 = await fetch("/add-stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ symbol, amount }) // email removed
          });
          if (!res2.ok) { alert("Failed to add stock"); return; }
          stockSymbolEl.value = "";
          sharesEl.value = "";
          await loadDashboard();
        } catch (e) { alert("Error validating stock symbol"); }
      });

      let sliderTimeout;
      percentSlider.addEventListener("input", function () {
      clearTimeout(sliderTimeout);
      sliderTimeout = setTimeout(() => {
        updateInvestmentAmount();
        setIncomeDisplay();
        renderSavingsChart();
      }, 300);
      });
      async function initInvestmentsSection() {
        await updateStockCache();   
        renderSavingsChart();     
      }
      incomeInput.addEventListener("input", function () { updateInvestmentAmount(); setIncomeDisplay(); });
      payInterval.addEventListener("change", function () { updateInvestmentAmount(); setIncomeDisplay(); });
      searchBtn.addEventListener("click", function () { searchStock(); });
      applyFilterBtn.addEventListener("click", function () { fetchStocks(); });

      whatIfForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const symbol = (stockWhatIf.value || "").toUpperCase();
        const months = Number(sdate.value);
        const shares = Number(sharesWhatIf.value);
        if (!symbol) { alert("Enter a stock symbol"); return; }
        if (!months || months < 1 || months > 12) { alert("Pick 1–12 months"); return; }
        if (!shares || shares < 1) { alert("Enter share count"); return; }
        try {
          const result = await runWhatIf(symbol, months, shares);
          if (result && result.historicalClose !== undefined) {
            const costThen = Number(result.historicalClose) * shares;
            const valueNow = Number(result.currentPrice) * shares;
            const diff = Number(result.difference);
            const pct = Number(result.percentChange);
            whatIfResult.innerHTML =
              '<span class="pill">Bought ' + shares + ' @ ' + months + 'm ago</span>' +
              '<span class="pill">Then: $' + costThen.toFixed(2) + '</span>' +
              '<span class="pill">Now: $' + valueNow.toFixed(2) + '</span>' +
              '<span class="pill">P/L: $' + diff.toFixed(2) + ' (' + pct.toFixed(2) + '%)</span>';
            await drawWhatIfChart(symbol, months);
          } else {
            alert("No historical data found for " + symbol);
          }
        } catch (e2) {
          alert("What-if failed");
        }
      });

      document.addEventListener("DOMContentLoaded", function () { loadDashboard(); });