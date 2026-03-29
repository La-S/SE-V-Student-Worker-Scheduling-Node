
import routes from "./app/routes/index.ts";
import express from "express"
import cors from "cors";
import "./app/crons/notifications.ts";


import https from 'https';
import fs from 'fs';
import firebaseApp from "./app/config/firebase.ts";
import { errorHandler } from "./app/error/errorhandler.ts";


const app = express();

const fbApp = firebaseApp;

if (process.env.NODE_ENV == "dev") {
  // add dev cors options.
  var corsOptions = {
    origin: ["http://localhost:8081", "https://localhost:8081"],
    credentials: true
  }
  app.use(cors(corsOptions));
}

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Load the routes from the routes folder
app.use("/workerscheduling-t3", routes);
app.use(errorHandler);

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
