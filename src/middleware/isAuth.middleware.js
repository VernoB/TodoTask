const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * @public
 * @function isAuth
 * @description take the request and try to generate the token with the header Autorisation
 * @param {Object} req set the userId to the form
 * @param {Object} res send the response when error occured to the client
 * @param {*} next use to send the error to the error handler
 * @returns {undefined} set the userId to the req header
 */
module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader)
    return res.status(401).json({ message: "Unauthorized !" }).send();

  const token = authHeader.split(" ")[1];
  let decodeToken;

  try {
    decodeToken = jwt.verify(token, process.env.TOKEN_SECRET);
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      error.statuCode = 500;
      // return res.send({ error });
      // console.log(error);
      error.message = "Token expired ! please logged again";
      throw error;
    } else {
      error.statuCode = 500;
      // console.log(error);
      return next(new Error("error in the token"));
    }
  }

  if (!decodeToken)
    return res.status(401).json({ message: "Unauthorized" }).send();
  req.userId = decodeToken.userId;
  next();
};
