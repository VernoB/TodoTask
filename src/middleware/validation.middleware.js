const { validationResult } = require("express-validator");
/**
 * @public
 * @function isError
 * @description take Express request with form and check if the data respect the condition
 * @param {*} req Express with form data
 */
module.exports.isError = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new Error(errors.array()[0].msg);
    // return res.status(422).send({ message: msgErrors });
  }
};
