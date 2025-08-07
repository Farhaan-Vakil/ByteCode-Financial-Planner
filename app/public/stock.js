const apiKey = "d290c7hr01qvka4rg1m0d290c7hr01qvka4rg1mg";

const incomeInput = document.getElementById("income");
const slider = document.getElementById("percentSlider");
const investPercent = document.getElementById("investPercent");
const investAmount = document.getElementById("investAmount");


slider.addEventListener("input", updateInvestmentAmount);
incomeInput.addEventListener("input", updateInvestmentAmount);

function updateInvestmentAmount() {
    const income = parseFloat(incomeInput.value) || 0;
    const percent = parseFloat(slider.value);
    const investAmt = ((percent / 100) * income).toFixed(2);
    investPercent.textContent = percent + "%";
    investAmount.textContent = investAmt;
}

// Fetch and display top 15 growth stocks
async function fetchStocks() {
    const tbody = document.querySelector("#stockTable tbody");
    tbody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

    try {
        const symbolRes = await fetch("top100.json");
        const symbols = await symbolRes.json();

        const stockData = await Promise.all(
            symbols.map(async function (symbol) {
                try {

                    const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
                    const quote = await quoteRes.json();

                    //name info
                    const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`);
                    const profile = await profileRes.json();

                    const change = quote.c - quote.pc;
                    const percent = (change / quote.pc) * 100;

                    const stockInfo = {};
                    stockInfo.name = profile.name || "N/A";
                    stockInfo.symbol = symbol;
                    stockInfo.price = quote.c;
                    stockInfo.change = change;
                    stockInfo.percent = percent;

                    return stockInfo;

                } catch (e) {
                    return null;
                }
            })
        );


        const filtered = stockData.filter(s => s && !isNaN(s.percent));

        filtered.sort(function (a, b) {
            return b.percent - a.percent;
        });

        const top15 = filtered.slice(0, 15);
        displayStockTable(top15);

    } catch (err) {
        console.error("Failed to fetch stock data:", err);
        tbody.innerHTML = "<tr><td colspan='4'>Failed to load data</td></tr>";
    }
}

async function searchStock() {
    const symbolInput = document.getElementById("stockSearch").value.trim().toUpperCase();
    const tbody = document.querySelector("#stockTable tbody");

    if (!symbolInput) {
        alert("Please enter a stock symbol.");
        return;
    }

    tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

    try {
        const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbolInput}&token=${apiKey}`);
        const quote = await quoteRes.json();

        const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbolInput}&token=${apiKey}`);
        const profile = await profileRes.json();

        const change = quote.c - quote.pc;
        const percent = (change / quote.pc) * 100;

        const stock = {
            name: profile.name,
            symbol: symbolInput,
            price: quote.c,
            change: change,
            percent: percent
        };

        displayStockTable([stock]);

    } catch (err) {
        console.error("Search failed:", err);
        tbody.innerHTML = `<tr><td colspan='5'>Stock not found or invalid symbol.</td></tr>`;
    }
}


//this will actually display the stocks
function displayStockTable(stocks) {
    const tbody = document.querySelector("#stockTable tbody");
    tbody.innerHTML = "";

    for (var i = 0; i < stocks.length; i++) {
        var stock = stocks[i];

        var row = document.createElement("tr");

        var cell0 = document.createElement("td");
        cell0.textContent = stock.name;
        row.appendChild(cell0);

        var cell1 = document.createElement("td");
        cell1.textContent = stock.symbol;
        row.appendChild(cell1);

        var cell2 = document.createElement("td");
        cell2.textContent = "$" + stock.price.toFixed(2);
        row.appendChild(cell2);

        var cell3 = document.createElement("td");
        cell3.textContent = stock.change.toFixed(2);
        row.appendChild(cell3);

        var cell4 = document.createElement("td");
        cell4.textContent = stock.percent.toFixed(2) + "%";
        row.appendChild(cell4);

        tbody.appendChild(row);
    }
}

