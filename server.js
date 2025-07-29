let express = require("express");
let app = express();
let hostname = "localhost";
let port = 3000;
function handleRequest(req, res) {
  console.log(req.originalUrl, req.headers, req.method);
  res.set("Content-Type", "text/plain");
  res.send("Hello!\n");
}
app.get("*", handleRequest);
app.listen(port, hostname, function () {
  console.log(`http://${hostname}:${port}`);
});