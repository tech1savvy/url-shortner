require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const { connectMongoDB } = require("./db");

const { restrictToLoggedInUserOnly, checkAuth } = require("./features/auth/auth.middleware.js");

const urlRoute = require("./features/url/url.routes");
const userRoute = require("./features/auth/auth.routes");
const staticRoute = require("./features/views/static.routes");

const app = express();
const PORT = process.env.PORT || 8002;

connectMongoDB(process.env.MONGO_URL).then(() =>
  console.log("MongoDB connected")
);

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "./features/views/templates"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/url", restrictToLoggedInUserOnly, urlRoute);
app.use("/user", userRoute);
app.use("/", checkAuth, staticRoute);

app.listen(PORT, () => console.log(`Server started at ${PORT}`));
