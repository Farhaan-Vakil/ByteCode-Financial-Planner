let express = require("express");
let app = express();
let hostname = "localhost";
let port = 3000;
let finnhub = require("finnhub");
let env = require("../../env.json");

const finnhubClient = new finnhub.DefaultApi(env.finnkey);

app.use(express.static("public"));
app.use(express.json());

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
    let stock = req.query.stock;
    let sdate = req.query.sdate;
    let edate = req.query.edate;
    console.log(stock);
    finnhubClient.companyNews(stock, sdate, edate, (error,data,response) => {
        
        if (error) {
            console.log(error);
            res.status(500).json({error: "failed to fetch stock news"});
        }
        res.status(200).json(data);
        console.log(data);


    });
})


app.listen(port, hostname, function () {
  console.log(`http://${hostname}:${port}`);
});