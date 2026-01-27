
import routes from "./app/routes/index.js";
import express from "express"
import cors from "cors";


import https from 'https';
import fs from 'fs';
import firebaseApp from "./app/config/firebase.js";


const app = express();

const fbApp = firebaseApp;

// Also use the cors middleware as backup
var corsOptions = {
  origin: "https://localhost:8081",
  credentials: true
}
app.use(cors(corsOptions));


// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
  
// Load the routes from the routes folder
app.use("/workerscheduling-t3", routes); 

// set port, listen for requests
const PORT = process.env.PORT || 3100;
if (process.env.NODE_ENV == "dev") {
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
