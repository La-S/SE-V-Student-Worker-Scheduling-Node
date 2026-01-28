
import routes from "./app/routes/index.js";
import express from "express"
import cors from "cors";


import https from 'https';
import fs from 'fs';

const app = express();

<<<<<<< Updated upstream
// Also use the cors middleware as backup
var corsOptions = {
  origin: "https://localhost:8081",
  credentials: true
=======
const fbApp = firebaseApp;

if (process.env.NODE_ENV == "dev") {
  // add dev cors options.
  var cors2Options = {
    origin: ["http://localhost:8081",  "https://localhost:8081"],
    credentials: true
  }
  app.use(cors(cors2Options));
>>>>>>> Stashed changes
}

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
  
// Load the routes from the routes folder
app.use("/workerscheduling-t3", routes); 

// set port, listen for requests
const PORT = process.env.PORT || 3100;
if (process.env.NODE_ENV == "dev" && !process.env.USE_HTTP) {
  https.createServer({
    key: fs.readFileSync('./localhost+2-key.pem'),
    cert: fs.readFileSync('./localhost+2.pem'),
  }, app).listen(PORT, () => {
    console.log(`Server is running on https port ${PORT}.`);
  });
} else {
  //prod
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

export default app;
