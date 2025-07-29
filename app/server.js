let express = require("express");
let app = express();
let hostname = "localhost";
let port = 3000;
app.use(express.static("public"));

app.listen(port, hostname, function () {
  console.log(`http://${hostname}:${port}`);
});