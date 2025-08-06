const { getUser } = require("./auth.service");

async function restrictToLoggedInUserOnly(req, res, next) {
  const token = req.cookies?.uid;
  if (!token) {
    return res.redirect("/login");
  }
  const user = getUser(token);
  if (!user) {
    return res.redirect("/login");
  }
  req.user = user;
  next();
}

async function checkAuth(req, res, next) {
  const token = req.cookies?.uid;
  const user = getUser(token);
  req.user = user;
  next();
}

module.exports = {
  restrictToLoggedInUserOnly,
  checkAuth,
};
