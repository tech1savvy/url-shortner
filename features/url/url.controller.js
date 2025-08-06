const { v4: uuidv4 } = require("uuid");
const URL = require("./url.model");

async function handleGenerateShortURL(req, res) {
  const body = req.body;
  if (!body.url)
    return res.status(400).json({
      error: "url not set",
    });
  const shortID = uuidv4().slice(0, 8);
  await URL.create({
    shortID: shortID,
    redirectURL: body.url,
    visitHistory: [],
    createdBy: req.user._id,
  });

  return res.render("home", { id: shortID });
}

async function handleGetRedirectURL(req, res) {
  const shortID = req.params.shortID;
  await URL.updateOne(
    {
      shortID: shortID,
    },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    }
  );
  const entry = await URL.findOne({ shortID });
  res.redirect(entry.redirectURL);
}

async function handleGetAnalytics(req, res) {
  const shortID = req.params.shortID;
  const result = await URL.findOne({ shortID });
  return res.json({
    totalClicks: result.visitHistory.length,
    analytics: result.visitHistory,
  });
}

module.exports = {
  handleGenerateShortURL,
  handleGetRedirectURL,
  handleGetAnalytics,
};