  let articles = document.getElementById("stock");
  
  document.getElementById("newsForm").addEventListener("submit", function(e) {
        e.preventDefault(); // Stop form from reloading page

        const sdate = document.getElementById("sdate").value;
        const edate = document.getElementById("edate").value;

        fetch(`/stockNews?stock=${"AAPL"}&sdate=${sdate}&edate=${edate}`).then((response) => {
                response.json().then((body) => {
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
        }})});

    
    });