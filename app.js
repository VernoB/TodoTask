/**
 * @name App.js
 * @module server
 * @file
 * @description it's the main file of this server, you can use it with command $npm start
 *
 * @version 1.0
 * @requires express
 * @requires dotenv
 * @requires body-parser
 * @requires path
 * @requires mongoose
 * @requires express-session
 * @requires cors
 * @requires morgan
 * @requires multer
 * @requires compression
 *
 */
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const logger = require("morgan");
const session = require("express-session");
const cors = require("cors");
const mongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
const compression = require("compression");
require("dotenv").config();

const userRoutes = require("./src/routes/user.route");
const todoRoutes = require("./src/routes/task.route");

const app = express();

const store = new mongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "todos",
});
/**
 * @function logger
 * @description this function will log every time that it's on development mode
 */
app.use(logger("dev"));

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
    cb(
      null,
      uniqueSuffix + "." + path.extname(file.originalname).split(".")[1]
    );
  },
});
/**
 * @function fileFilter
 * @description filter the image extension and throw an error if not accepted
 * @param {*} req
 * @param {*} file containt the file data
 * @param {*} cb reteurn true if the extension file is valid, if not, throws an error
 */
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.urlencoded({ extended: true })); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(compression());
app.use(cors());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(
  session({
    secret: process.env.S_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
  })
);

/**
 * @description defines the main routes of the application
 * / for all the task routes and /auth for all the auth routes
 */

app.use("/", todoRoutes);
app.use("/auth", userRoutes);

//catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error("Not found!");
  // console.log(err);
  err.status = 404;
  next(err);
});

//Errors handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const msg = err.message;
  const data = err.data;
  return res.status(status).json({ message: msg, data });
});

//server
app.set("port", process.env.PORT || 3000);
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    return app.listen(app.get("port"));
  })
  .then(() => {
    console.debug("The app successfully connected to the database");
    console.info("Server is ready and listening on port " + app.get("port"));
  })
  .catch((err) => {
    if (err) return next(err);
    console.error("Error to connect to the database");
  });

module.exports = app;
