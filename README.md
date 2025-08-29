To Run the Project Locally:

1.  Go to https://finnhub.io/register to get an API key
2.  Create a file called "env.json" based on the "env_sample.json" in the directory
3.  Put in your API key from Finnhub in the "apiKey" section and the AWS password that was sent via email for "AWS_Password"
4.  In server.js uncomment line 10 and recomment lines 15-22. 
5.  In server.js, change lines 397-399 to app.listen(port, "localhost", () => { console.log(`Server running at http://localhost:${port}/`);});
6.  In server.js change lines 39-43 to cookie: { secure: process.env.NODE_ENV === "production", sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000};
7.  Type npm install to install all the packages.
8.  Finally, type npm start to start the server.
