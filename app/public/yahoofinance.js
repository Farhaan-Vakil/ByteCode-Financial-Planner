import yahooFinance from "yahoo-finance2";

async function comparePrice() {
  try {
    const history = await yahooFinance.historical("AAPL", {
      period1: "2023-01-03", // start date
      period2: "2023-01-04", // end date 
      interval: "1d"
    });

    const historicalClose = history[0]?.close;

    const quote = await yahooFinance.quote("AAPL");
    const currentPrice = quote.regularMarketPrice;

    console.log(`Close on 2023-01-03: $${historicalClose}`);
    console.log(`Current Price:       $${currentPrice}`);
    console.log(
      `Difference:          $${(currentPrice - historicalClose).toFixed(2)}`
    );
  } catch (err) {
    console.error(err);
  }
}

comparePrice();