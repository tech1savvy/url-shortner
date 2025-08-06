const express = require("express");
const {
  handleGenerateShortURL,
  handleGetRedirectURL,
  handleGetAnalytics,
} = require("./url.controller.js");

const router = express.Router();

router.post("/", handleGenerateShortURL);

router.get("/:shortID", handleGetRedirectURL);

router.get("/analytics/:shortID", handleGetAnalytics);

module.exports = router;
