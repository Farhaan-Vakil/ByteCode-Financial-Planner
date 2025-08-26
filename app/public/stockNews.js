  let articles = document.getElementById("stock");

  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let stockSymbol = urlParams.get('stockSymbol');
  let sdate = 1;

  function getDateNMonthAgo(n) {
        const d = new Date();
        d.setMonth(d.getMonth() - n); 
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
 }
module.exports = { getDateNMonthAgo };

  function getStockNews(stockSymbol, sdate) {
    fetch(`/stockNews?stockSymbol=${stockSymbol}&sdate=${getDateNMonthAgo(sdate)}&edate=${getDateNMonthAgo(0)}`).then((response) => {
                response.json().then((body) => {
        articles.innerHTML = "";
        
        for (i = 0; i < body.length; i ++) {
            let article = document.createElement("article");
            let headline = document.createElement("h2");
            let a = document.createElement("a");
            a.href = body[i].url;
            a.textContent = (body[i].headline);
            headline.appendChild(a);

            let source = document.createElement("h3");
            source.textContent = body[i].source;
            let sum = document.createElement("p");
            sum.textContent = body[i].summary;
            let img = document.createElement("img");
            img.src = body[i].image;
            img.alt = body[i].source;

            article.appendChild(headline);
            article.appendChild(img);
            article.appendChild(source);
            article.appendChild(sum);

            articles.appendChild(article);
        }})})
    
  }     

  

  
  console.log(stockSymbol);



  

  document.getElementById("stock-title").textContent = "News for " + stockSymbol;

  document.addEventListener("DOMContentLoaded",  function () {
  getStockNews(stockSymbol, sdate);
});

  document.getElementById("newsForm").addEventListener("submit", function(e) {
        e.preventDefault();
        sdate = document.getElementById("sdate").value;
        getStockNews(stockSymbol, sdate)

    });